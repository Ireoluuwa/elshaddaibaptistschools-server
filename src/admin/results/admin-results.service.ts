import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TerminalResult } from '../../results/entities/terminal-result.entity';
import { ResultStatus } from '../../results/enums/result-status.enum';
import { Term } from '../../academics/entities/term.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import { assertTermOpenForAdmin } from '../../academics/term-lock';

@Injectable()
export class AdminResultsService {
  constructor(
    @InjectRepository(TerminalResult)
    private readonly resultRepository: Repository<TerminalResult>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  // How far each class is with results for a term.
  async overview(termId: string) {
    const term = await this.findTerm(termId);
    const [classes, roster] = await Promise.all([
      this.classRepository.find({ order: { name: 'ASC' } }),
      this.enrollmentsService.rosterFor(term.academicYear.id),
    ]);
    const results = await this.resultsFor(
      termId,
      roster.map((e) => e.student.id),
    );

    return classes.map((c) => {
      const students = roster.filter((e) => e.schoolClass.id === c.id);
      const entered = students
        .map((e) => results.get(e.student.id))
        .filter((r): r is TerminalResult => !!r);
      const published = entered.filter(
        (r) => r.status === ResultStatus.PUBLISHED,
      );
      return {
        classId: c.id,
        className: c.name,
        students: students.length,
        entered: entered.length,
        published: published.length,
        vpRemarks: published.filter((r) => !!r.vpRemark).length,
      };
    });
  }

  // Every student in the class that term, with their result if one was entered.
  async classResults(termId: string, classId: string) {
    const term = await this.findTerm(termId);
    const roster = await this.enrollmentsService.rosterFor(
      term.academicYear.id,
      classId,
    );
    const results = await this.resultsFor(
      termId,
      roster.map((e) => e.student.id),
    );

    return roster.map((e) => {
      const result = results.get(e.student.id);
      return {
        studentId: e.student.id,
        username: e.student.user.username,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        department: e.department?.name ?? null,
        result: result
          ? {
              id: result.id,
              status: result.status,
              scores: result.scores,
              daysAttended: result.daysAttended,
              totalDays: result.totalDays,
              teacherRemark: result.teacherRemark ?? null,
              vpRemark: result.vpRemark,
            }
          : null,
      };
    });
  }

  async setVpRemark(resultId: string, vpRemark: string | null) {
    const result = await this.resultRepository.findOne({
      where: { id: resultId },
      relations: ['term'],
    });
    if (!result) throw new NotFoundException('Result not found');
    assertTermOpenForAdmin(result.term);
    result.vpRemark = vpRemark?.trim() || null;
    await this.resultRepository.save(result);
    return { id: result.id, vpRemark: result.vpRemark };
  }

  private async findTerm(id: string) {
    const term = await this.termRepository.findOne({
      where: { id },
      relations: ['academicYear'],
    });
    if (!term) throw new NotFoundException('Term not found');
    return term;
  }

  private async resultsFor(termId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, TerminalResult>();
    const results = await this.resultRepository.find({
      where: { term: { id: termId }, student: { id: In(studentIds) } },
      relations: ['student'],
    });
    return new Map(results.map((r) => [r.student.id, r]));
  }
}
