import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AcademicYear } from '../../academics/entities/academic-year.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';
import { Department } from '../../academics/entities/department.entity';
import { TerminalResult } from '../../results/entities/terminal-result.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { EnrollmentOutcome } from '../../enrollments/enums/enrollment-outcome.enum';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import { SavePromotionsDto } from './dto/save-promotions.dto';

const overallOf = (scores: { test1: number; test2: number; exam: number }[]) =>
  scores.length
    ? scores.reduce((sum, s) => sum + s.test1 + s.test2 + s.exam, 0) /
      scores.length
    : null;

@Injectable()
export class AdminPromotionsService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly yearRepository: Repository<AcademicYear>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(TerminalResult)
    private readonly resultRepository: Repository<TerminalResult>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly dataSource: DataSource,
  ) {}

  // Progress per class for the current session.
  async summary() {
    const year = await this.currentYear();
    const [classes, roster] = await Promise.all([
      this.classRepository.find({
        relations: ['nextClass'],
        order: { name: 'ASC' },
      }),
      this.enrollmentsService.rosterFor(year.id),
    ]);
    return {
      session: { id: year.id, name: year.name },
      classes: classes.map((c) => {
        const students = roster.filter((e) => e.schoolClass.id === c.id);
        const decided = students.filter((e) => e.outcome).length;
        return {
          classId: c.id,
          className: c.name,
          isSenior: c.isSenior,
          nextClass: c.nextClass
            ? {
                id: c.nextClass.id,
                name: c.nextClass.name,
                isSenior: c.nextClass.isSenior,
              }
            : null,
          students: students.length,
          decided,
          done: students.length > 0 && decided === students.length,
        };
      }),
    };
  }

  // Each student with their session average and any saved decision.
  async forClass(classId: string) {
    const year = await this.currentYear();
    const schoolClass = await this.findClass(classId);
    const roster = await this.enrollmentsService.rosterFor(year.id, classId);
    const ids = roster.map((e) => e.student.id);

    const results = ids.length
      ? await this.resultRepository.find({
          where: {
            student: { id: In(ids) },
            term: { academicYear: { id: year.id } },
          },
          relations: ['student'],
        })
      : [];

    return {
      session: { id: year.id, name: year.name },
      classId: schoolClass.id,
      className: schoolClass.name,
      nextClass: schoolClass.nextClass
        ? {
            id: schoolClass.nextClass.id,
            name: schoolClass.nextClass.name,
            isSenior: schoolClass.nextClass.isSenior,
          }
        : null,
      // A department is chosen when moving from a junior class into a senior one.
      needsDepartment:
        !schoolClass.isSenior && !!schoolClass.nextClass?.isSenior,
      students: roster.map((e) => {
        const termAverages = results
          .filter((r) => r.student.id === e.student.id)
          .map((r) => overallOf(r.scores))
          .filter((v): v is number => v !== null);
        return {
          studentId: e.student.id,
          username: e.student.user.username,
          firstName: e.student.firstName,
          lastName: e.student.lastName,
          department: e.department?.name ?? null,
          average: termAverages.length
            ? Math.round(
                (termAverages.reduce((a, b) => a + b, 0) /
                  termAverages.length) *
                  10,
              ) / 10
            : null,
          termsCounted: termAverages.length,
          outcome: e.outcome,
          nextDepartmentId: e.nextDepartment?.id ?? null,
        };
      }),
    };
  }

  async save(classId: string, dto: SavePromotionsDto) {
    const year = await this.currentYear();
    const schoolClass = await this.findClass(classId);
    const roster = await this.enrollmentsService.rosterFor(year.id, classId);
    const byStudent = new Map(dto.decisions.map((d) => [d.studentId, d]));

    const missing = roster.filter((e) => !byStudent.has(e.student.id));
    if (missing.length) {
      throw new BadRequestException(
        `Decide for every student (${missing.length} missing)`,
      );
    }
    const needsDepartment =
      !schoolClass.isSenior && !!schoolClass.nextClass?.isSenior;

    for (const d of dto.decisions) {
      if (!roster.some((e) => e.student.id === d.studentId)) {
        throw new BadRequestException(
          'A student in the list is not in this class',
        );
      }
      if (d.outcome === EnrollmentOutcome.GRADUATED && schoolClass.nextClass) {
        throw new BadRequestException(
          `Students graduate from the final class, not ${schoolClass.name}`,
        );
      }
      if (d.outcome === EnrollmentOutcome.PROMOTED && !schoolClass.nextClass) {
        throw new BadRequestException(
          `${schoolClass.name} is the final class; choose graduate instead`,
        );
      }
      if (
        d.outcome === EnrollmentOutcome.PROMOTED &&
        needsDepartment &&
        !d.departmentId
      ) {
        throw new BadRequestException(
          `Choose a department for everyone moving to ${schoolClass.nextClass?.name}`,
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (const e of roster) {
        const d = byStudent.get(e.student.id)!;
        const nextDepartment =
          d.outcome === EnrollmentOutcome.PROMOTED &&
          needsDepartment &&
          d.departmentId
            ? await manager.findOneOrFail(Department, {
                where: { id: d.departmentId },
              })
            : null;
        await manager.update(
          Enrollment,
          { id: e.id },
          { outcome: d.outcome, nextDepartment },
        );
      }
    });
    return this.forClass(classId);
  }

  async undo(classId: string) {
    const year = await this.currentYear();
    await this.findClass(classId);
    const roster = await this.enrollmentsService.rosterFor(year.id, classId);
    if (roster.length) {
      await this.dataSource.manager.update(
        Enrollment,
        { id: In(roster.map((e) => e.id)) },
        { outcome: null, nextDepartment: null },
      );
    }
    return this.forClass(classId);
  }

  private async currentYear() {
    const year = await this.yearRepository.findOne({
      where: { isCurrent: true },
    });
    if (!year) throw new NotFoundException('There is no current session');
    return year;
  }

  private async findClass(id: string) {
    const schoolClass = await this.classRepository.findOne({
      where: { id },
      relations: ['nextClass'],
    });
    if (!schoolClass) throw new NotFoundException('Class not found');
    return schoolClass;
  }
}
