import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TerminalResult } from './entities/terminal-result.entity';
import { Term } from '../academics/entities/term.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsService } from '../academics/academics.service';
import { UpsertResultDto } from './dto/upsert-result.dto';
import { BulkUpsertResultDto } from './dto/bulk-upsert-result.dto';
import { ResultStatus } from './enums/result-status.enum';
import {
  EnrollmentsService,
  Placement,
  placementLabel,
} from '../enrollments/enrollments.service';
import { EnrollmentOutcome } from '../enrollments/enums/enrollment-outcome.enum';
import { BursaryService } from '../bursary/bursary.service';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(TerminalResult)
    private readonly resultRepository: Repository<TerminalResult>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly academicsService: AcademicsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly bursaryService: BursaryService,
  ) {}

  async upsertResult(dto: UpsertResultDto) {
    const { studentId, termId, ...resultData } = dto;

    const term = await this.academicsService.findOpenTermOrFail(termId);
    await this.assertActiveStudent(studentId);

    const existing = await this.resultRepository.findOne({
      where: { student: { id: studentId }, term: { id: termId } },
    });

    if (existing) {
      Object.assign(existing, resultData);
      return this.resultRepository.save(existing);
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const result = this.resultRepository.create({
      student,
      term,
      ...resultData,
    });

    return this.resultRepository.save(result);
  }

  async getTeacherInit(userId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass'],
    });

    if (!teacher || !teacher.schoolClass) {
      throw new NotFoundException('Teacher or assigned class not found');
    }

    const active = await this.academicsService.getCurrentTerm();

    const students = await this.studentRepository.find({
      where: {
        schoolClass: { id: teacher.schoolClass.id },
        user: { isActive: true },
      },
      order: { firstName: 'ASC' },
      relations: ['user'],
    });

    const periods = await this.academicsService.getAllPeriods();

    return {
      activePeriod: {
        termId: active?.id || null,
        yearId: active?.academicYear?.id || null,
      },
      classInfo: {
        id: teacher.schoolClass.id,
        name: teacher.schoolClass.name,
      },
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        studentId: s.user?.username || 'N/A',
      })),
      periods,
    };
  }

  async getStudentResult(studentId: string, termId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['schoolClass', 'department', 'user'],
    });

    if (!student) throw new NotFoundException('Student not found');

    const result = await this.resultRepository.findOne({
      where: { student: { id: studentId }, term: { id: termId } },
      relations: ['term', 'term.academicYear'],
    });

    const placement = await this.enrollmentsService.placementForTerm(
      student,
      termId,
    );

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        class: placementLabel(placement),
        studentId: student.user?.username || 'N/A',
        classId: placement.schoolClass?.id || null,
        departmentId: placement.department?.id || null,
        teacherName: await this.classTeacherName(placement.schoolClass?.id),
      },
      result: result
        ? this.forReportSheet(
            result,
            await this.bursaryService.reportFees(
              studentId,
              termId,
              placement.schoolClass?.id ?? null,
            ),
            placement,
            await this.termScores(studentId, result.term, false),
            await this.schoolSignature(),
          )
        : null,
    };
  }

  async getMyResult(userId: string, termId?: string) {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass', 'department', 'user'],
    });

    if (!student) throw new NotFoundException('Student not found');

    const active = await this.academicsService.getCurrentTerm();
    const periods = await this.academicsService.getAllPeriods();
    const targetTermId = termId || active?.id;

    if (!targetTermId)
      return { periods, activeTermId: null, result: null, student: null };

    const term = await this.academicsService.findTermById(targetTermId);
    const released = !!term?.resultsReleasedAt;
    // Nothing about the result (or fees) is sent before the admin releases it.
    const result = released
      ? await this.resultRepository.findOne({
          where: {
            student: { id: student.id },
            term: { id: targetTermId },
            status: ResultStatus.PUBLISHED,
          },
          relations: ['term', 'term.academicYear'],
        })
      : null;

    const placement = await this.enrollmentsService.placementForTerm(
      student,
      targetTermId,
    );
    const fees = await this.bursaryService.reportFees(
      student.id,
      targetTermId,
      placement.schoolClass?.id ?? null,
    );
    // Owing fees: the result is held back and never sent to the student.
    const feesHold =
      result && fees.outstanding > 0 ? { outstanding: fees.outstanding } : null;

    return {
      periods,
      activeTermId: active?.id || null,
      selectedTermId: targetTermId,
      student: {
        name: [student.firstName, student.lastName].filter(Boolean).join(' '),
        class: placementLabel(placement),
        studentId: student.user?.username || 'N/A',
        teacherName: await this.classTeacherName(placement.schoolClass?.id),
      },
      result:
        result && !feesHold
          ? this.forReportSheet(
              result,
              fees,
              placement,
              await this.termScores(student.id, result.term, true),
              await this.schoolSignature(),
            )
          : null,
      feesHold,
      notReleased: !released,
    };
  }

  async getSubjectsForStudent(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['schoolClass', 'department'],
    });

    if (!student) throw new NotFoundException('Student not found');

    const subjects = await this.academicsService.getMappedSubjects(
      student.schoolClass?.id,
      student.department?.id || null,
    );

    return subjects.map((s) => ({ id: s.id, name: s.name }));
  }

  async bulkUpsertResults(dto: BulkUpsertResultDto) {
    const errors: {
      studentId: string;
      studentName: string;
      subjectName: string;
      expected: string;
    }[] = [];

    for (const termId of new Set(dto.results.map((r) => r.termId))) {
      await this.academicsService.findOpenTermOrFail(termId);
    }

    // Phase 1 — validate all subject names against curriculum
    for (const entry of dto.results) {
      const student = await this.studentRepository.findOne({
        where: { id: entry.studentId },
        relations: ['schoolClass', 'department', 'user'],
      });

      if (!student) {
        throw new NotFoundException(
          `Student with id ${entry.studentId} not found`,
        );
      }
      if (!student.user?.isActive) {
        throw new ForbiddenException(
          `${student.firstName} ${student.lastName} has been removed by the admin. Take them out of the upload and try again.`,
        );
      }

      const placement = await this.enrollmentsService.placementForTerm(
        student,
        entry.termId,
      );
      const curriculumSubjects = await this.academicsService.getMappedSubjects(
        placement.schoolClass?.id as string,
        placement.department?.id || null,
      );

      const subjectNames = curriculumSubjects.map((s) =>
        s.name.toLowerCase().trim(),
      );

      for (const score of entry.scores) {
        const normalized = score.subjectName.toLowerCase().trim();
        if (!subjectNames.includes(normalized)) {
          const closest = curriculumSubjects.find(
            (s) =>
              s.name.toLowerCase().includes(normalized) ||
              normalized.includes(s.name.toLowerCase()),
          );
          errors.push({
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            subjectName: score.subjectName,
            expected: closest?.name || 'Unknown — check curriculum',
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Upload failed: invalid subject names found',
        errors,
      });
    }

    const saved = await Promise.all(
      dto.results.map((entry) => this.upsertResult(entry)),
    );

    return { saved: saved.length };
  }

  private async classTeacherName(classId?: string) {
    if (!classId) return null;
    const teacher = await this.teacherRepository.findOne({
      where: { schoolClass: { id: classId } },
      relations: ['user'],
    });
    if (!teacher) return null;
    const name = [teacher.firstName, teacher.lastName]
      .filter((n) => n?.trim())
      .join(' ');
    return name || teacher.user?.username || null;
  }
  // Groups the term's signature and dates the way the report sheet reads them.
  private forReportSheet(
    result: TerminalResult,
    fees: { outstanding: number; nextTermTuition: number; ict: number },
    placement: Placement,
    termScores: { term: string; score: number | null }[],
    signatureUrl: string | null,
  ) {
    const { term } = result;
    const { signedDate, vacationDate, resumptionDate } = term;
    const hasDetails =
      signatureUrl || signedDate || vacationDate || resumptionDate;
    return {
      ...result,
      fees,
      promotion: this.promotionFor(term.name, placement),
      termScores,
      term: {
        id: term.id,
        name: term.name,
        academicYear: term.academicYear,
        reportDetails: hasDetails
          ? { signatureUrl, signedDate, vacationDate, resumptionDate }
          : null,
      },
    };
  }

  // Report sheets are signed with the signature saved in the admin's Profile.
  private async schoolSignature(): Promise<string | null> {
    const [row] = await this.resultRepository.manager.query<
      { signatureUrl: string }[]
    >(
      `SELECT sp."signatureUrl" FROM staff_profiles sp JOIN users u ON u.id = sp."userId"
       WHERE u.role = 'admin' AND u."isActive" AND sp."signatureUrl" IS NOT NULL
       ORDER BY sp."updatedAt" DESC LIMIT 1`,
    );
    return row?.signatureUrl ?? null;
  }

  // Overall score for each term of the session, up to the one on the sheet.
  // Students only see terms whose results have been released.
  private async termScores(
    studentId: string,
    term: Term,
    releasedOnly: boolean,
  ) {
    const results = await this.resultRepository.find({
      where: {
        student: { id: studentId },
        status: ResultStatus.PUBLISHED,
        term: { academicYear: { id: term.academicYear.id } },
      },
      relations: ['term'],
    });
    const scoreFor = (name: string) => {
      const r = results.find((x) => x.term.name === name);
      if (!r || !r.scores.length || r.term.startDate > term.startDate)
        return null;
      if (releasedOnly && !r.term.resultsReleasedAt) return null;
      const obtained = r.scores.reduce(
        (sum, s) => sum + s.test1 + s.test2 + s.exam,
        0,
      );
      return Math.round((obtained / (r.scores.length * 100)) * 1000) / 10;
    };
    return ['1st Term', '2nd Term', '3rd Term'].map((name) => ({
      term: name,
      score: scoreFor(name),
    }));
  }

  // Printed on the 3rd Term report sheet once the admin has decided.
  private promotionFor(termName: string, placement: Placement) {
    const { outcome, schoolClass } = placement;
    const shown = [
      EnrollmentOutcome.PROMOTED,
      EnrollmentOutcome.REPEATED,
      EnrollmentOutcome.GRADUATED,
    ];
    if (termName !== '3rd Term' || !outcome || !shown.includes(outcome))
      return null;
    return {
      outcome,
      nextClass:
        outcome === EnrollmentOutcome.PROMOTED
          ? (schoolClass?.nextClass?.name ?? null)
          : null,
    };
  }

  // Removed students can't receive new results or reports.
  private async assertActiveStudent(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.user?.isActive) {
      throw new ForbiddenException(
        'This student has been removed by the admin.',
      );
    }
  }
}
