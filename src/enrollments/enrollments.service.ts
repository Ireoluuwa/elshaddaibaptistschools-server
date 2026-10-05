import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { AcademicYear } from '../academics/entities/academic-year.entity';
import { Term } from '../academics/entities/term.entity';
import { Student } from '../profile/entities/models/student.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { Department } from '../academics/entities/department.entity';

export interface Placement {
  schoolClass: SchoolClass | null;
  department: Department | null;
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
          relations: ['schoolClass', 'department'],
        })
      : null;

    return enrollment
      ? {
          schoolClass: enrollment.schoolClass,
          department: enrollment.department,
        }
      : {
          schoolClass: student.schoolClass ?? null,
          department: student.department ?? null,
        };
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

export const placementLabel = ({ schoolClass, department }: Placement) =>
  `${schoolClass?.name ?? ''} ${department?.name ?? ''}`.trim();
