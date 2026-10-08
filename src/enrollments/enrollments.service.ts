import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { AcademicYear } from '../academics/entities/academic-year.entity';
import { Term } from '../academics/entities/term.entity';
import { Student } from '../profile/entities/models/student.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { Department } from '../academics/entities/department.entity';
import { EnrollmentOutcome } from './enums/enrollment-outcome.enum';

export interface Placement {
  schoolClass: SchoolClass | null;
  department: Department | null;
  // The end-of-session promotion decision, once the admin has made it.
  outcome?: EnrollmentOutcome | null;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  // The class a student was in during a term. Falls back to their current class.
  async placementForTerm(student: Student, termId: string): Promise<Placement> {
    const term = await this.termRepository.findOne({
      where: { id: termId },
      relations: ['academicYear'],
    });
    const enrollment = term
      ? await this.enrollmentRepository.findOne({
          where: {
            student: { id: student.id },
            academicYear: { id: term.academicYear.id },
          },
          relations: ['schoolClass', 'schoolClass.nextClass', 'department'],
        })
      : null;

    return enrollment
      ? {
          schoolClass: enrollment.schoolClass,
          department: enrollment.department,
          outcome: enrollment.outcome,
        }
      : {
          schoolClass: student.schoolClass ?? null,
          department: student.department ?? null,
        };
  }

  // Newest session first.
  historyFor(studentId: string) {
    return this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['academicYear', 'schoolClass', 'department'],
      order: { academicYear: { name: 'DESC' } },
    });
  }

  // Students in a session (optionally one class), leaving out removed accounts.
  rosterFor(academicYearId: string, classId?: string) {
    return this.enrollmentRepository.find({
      where: {
        academicYear: { id: academicYearId },
        ...(classId ? { schoolClass: { id: classId } } : {}),
        student: { user: { isActive: true } },
      },
      relations: [
        'student',
        'student.user',
        'schoolClass',
        'department',
        'nextDepartment',
      ],
      order: { student: { lastName: 'ASC', firstName: 'ASC' } },
    });
  }

  async graduatedStudentIds() {
    const rows = await this.enrollmentRepository.find({
      where: { outcome: EnrollmentOutcome.GRADUATED },
      relations: ['student'],
      select: { id: true, student: { id: true } },
    });
    return new Set(rows.map((r) => r.student.id));
  }

  async setCurrentOutcome(
    manager: EntityManager,
    studentId: string,
    outcome: EnrollmentOutcome | null,
  ) {
    const year = await manager.findOne(AcademicYear, {
      where: { isCurrent: true },
    });
    if (!year) return;
    await manager.update(
      Enrollment,
      { student: { id: studentId }, academicYear: { id: year.id } },
      { outcome },
    );
  }

  // Moves everyone into the new session using the outcomes decided at promotion.
  // Runs once: does nothing if the new session already has enrollments.
  async rollOver(
    manager: EntityManager,
    fromYearId: string,
    toYearId: string,
  ): Promise<RollOverSummary> {
    const summary = { promoted: 0, repeated: 0, graduated: 0 };
    if (
      await manager.exists(Enrollment, {
        where: { academicYear: { id: toYearId } },
      })
    ) {
      return summary;
    }

    const enrollments = await manager.find(Enrollment, {
      where: { academicYear: { id: fromYearId } },
      relations: [
        'student',
        'student.user',
        'schoolClass',
        'schoolClass.nextClass',
        'department',
        'nextDepartment',
      ],
    });

    for (const e of enrollments) {
      const { student } = e;
      if (e.outcome === EnrollmentOutcome.WITHDRAWN || !student.user?.isActive)
        continue;

      const next = e.schoolClass.nextClass;
      const graduates =
        e.outcome === EnrollmentOutcome.GRADUATED ||
        (e.outcome === EnrollmentOutcome.PROMOTED && !next);

      if (graduates) {
        // Off every class list; they can still sign in to see past results.
        await manager.update(
          Student,
          { id: student.id },
          {
            schoolClass: null as unknown as SchoolClass,
            department: null as unknown as Department,
          },
        );
        summary.graduated++;
        continue;
      }

      // Promoted moves up; repeating or undecided stays in the same class.
      const promoted = e.outcome === EnrollmentOutcome.PROMOTED && !!next;
      const schoolClass = promoted ? next : e.schoolClass;
      const department = schoolClass.isSenior
        ? (e.nextDepartment ?? e.department)
        : null;

      await manager.save(
        manager.create(Enrollment, {
          student: { id: student.id },
          academicYear: { id: toYearId },
          schoolClass: { id: schoolClass.id },
          department: department ? { id: department.id } : null,
        }),
      );
      await manager.update(
        Student,
        { id: student.id },
        {
          schoolClass: { id: schoolClass.id },
          department: department
            ? { id: department.id }
            : (null as unknown as Department),
        },
      );
      if (promoted) summary.promoted++;
      else summary.repeated++;
    }
    return summary;
  }

  // For the first session, when there's nothing to roll over from: every active
  // student with a class is enrolled in the class they're in now.
  async enrollPlacedStudents(manager: EntityManager, yearId: string) {
    await manager.query(
      `INSERT INTO enrollments ("studentId", "academicYearId", "schoolClassId", "departmentId")
       SELECT s.id, $1, s."schoolClassId", s."departmentId"
       FROM student_profiles s JOIN users u ON u.id = s."userId"
       WHERE u."isActive" AND s."schoolClassId" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e."studentId" = s.id AND e."academicYearId" = $1)`,
      [yearId],
    );
  }

  // Records the student's class for the current session (no-op if no session is current).
  async enrollInCurrentSession(manager: EntityManager, student: Student) {
    const year = await manager.findOne(AcademicYear, {
      where: { isCurrent: true },
    });
    if (!year) return;

    const existing = await manager.findOne(Enrollment, {
      where: { student: { id: student.id }, academicYear: { id: year.id } },
    });
    await manager.save(
      manager.create(Enrollment, {
        id: existing?.id,
        student: { id: student.id },
        academicYear: { id: year.id },
        schoolClass: { id: student.schoolClass.id },
        department: student.department ? { id: student.department.id } : null,
      }),
    );
  }
}

export interface RollOverSummary {
  promoted: number;
  repeated: number;
  graduated: number;
}

export const placementLabel = ({ schoolClass, department }: Placement) =>
  `${schoolClass?.name ?? ''} ${department?.name ?? ''}`.trim();
