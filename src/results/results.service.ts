import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TerminalResult } from './entities/terminal-result.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsService } from '../academics/academics.service';
import { UpsertResultDto } from './dto/upsert-result.dto';
import { BulkUpsertResultDto } from './dto/bulk-upsert-result.dto';
import { ResultStatus } from './enums/result-status.enum';

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
  ) {}

  async upsertResult(dto: UpsertResultDto) {
    const { studentId, termId, ...resultData } = dto;

    const term = await this.academicsService.findTermById(termId);
    if (!term) throw new NotFoundException('Term not found');

    const existing = await this.resultRepository.findOne({
      where: { student: { id: studentId }, term: { id: termId } },
    });

    if (existing) {
      Object.assign(existing, resultData);
      return this.resultRepository.save(existing);
    }

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
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
      where: { schoolClass: { id: teacher.schoolClass.id } },
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
    });

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        class: `${student.schoolClass?.name || ''} ${student.department?.name || ''}`.trim(),
        studentId: student.user?.username || 'N/A',
        classId: student.schoolClass?.id || null,
        departmentId: student.department?.id || null,
      },
      result: result || null,
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

    if (!targetTermId) return { periods, activeTermId: null, result: null, student: null };

    const result = await this.resultRepository.findOne({
      where: {
        student: { id: student.id },
        term: { id: targetTermId },
        status: ResultStatus.PUBLISHED,
      },
      relations: ['term', 'term.academicYear'],
    });

    return {
      periods,
      activeTermId: active?.id || null,
      selectedTermId: targetTermId,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        class: `${student.schoolClass?.name || ''} ${student.department?.name || ''}`.trim(),
        studentId: student.user?.username || 'N/A',
      },
      result: result || null,
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
    const errors: { studentId: string; studentName: string; subjectName: string; expected: string }[] = [];

    // Phase 1 — validate all subject names against curriculum
    for (const entry of dto.results) {
      const student = await this.studentRepository.findOne({
        where: { id: entry.studentId },
        relations: ['schoolClass', 'department'],
      });

      if (!student) {
        throw new NotFoundException(`Student with id ${entry.studentId} not found`);
      }

      const curriculumSubjects = await this.academicsService.getMappedSubjects(
        student.schoolClass?.id,
        student.department?.id || null,
      );

      const subjectNames = curriculumSubjects.map((s) => s.name.toLowerCase().trim());

      for (const score of entry.scores) {
        const normalized = score.subjectName.toLowerCase().trim();
        if (!subjectNames.includes(normalized)) {
          const closest = curriculumSubjects.find((s) =>
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

    const saved = await Promise.all(dto.results.map((entry) => this.upsertResult(entry)));

    return { saved: saved.length };
  }
}
