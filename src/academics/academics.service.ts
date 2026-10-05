import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { Department } from './entities/department.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { Term } from './entities/term.entity';
import { Subject } from './entities/subject.entity';
import { Curriculum } from './entities/curriculum.entity';
import { TermStatus } from './enums/term-status.enum';
import { Student } from '../profile/entities/models/student.entity';

@Injectable()
export class AcademicsService {

  constructor(
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepository: Repository<Curriculum>,
  ) {}

  async getCurrentTerm() {
    const term = await this.termRepository.findOne({
      where: { isCurrent: true },
      relations: ['academicYear'],
    });

    if (!term) return null;

    // Calculate current week
    const start = new Date(term.startDate);
    const today = new Date();
    const diffInMs = today.getTime() - start.getTime();
    const weekNumber = Math.ceil(diffInMs / (7 * 24 * 60 * 60 * 1000));

    return {
      ...term,
      currentWeek: weekNumber > 0 ? weekNumber : 1,
    };
  }

  async getAllPeriods() {
    const years = await this.academicYearRepository.find({
      relations: ['terms'],
      order: {
        name: 'DESC',
        terms: {
          name: 'ASC',
        },
      },
    });

    const today = new Date();

    return years.map((year) => ({
      ...year,
      terms: year.terms.map((term) => {
        if (!term.isCurrent) return term;

        const start = new Date(term.startDate);
        const diffInMs = today.getTime() - start.getTime();
        const weekNumber = Math.ceil(diffInMs / (7 * 24 * 60 * 60 * 1000));

        return {
          ...term,
          currentWeek: weekNumber > 0 ? weekNumber : 1,
        };
      }),
    }));
  }

  async createClass(name: string, isSenior: boolean) {

    const existing = await this.classRepository.findOne({ where: { name } });
    if (existing) throw new ConflictException('Class already exists');

    const schoolClass = this.classRepository.create({ name, isSenior });
    return this.classRepository.save(schoolClass);
  }

  async getAllClasses() {
    const classes = await this.classRepository.find({
      relations: ['nextClass'],
      order: { name: 'ASC' },
    });
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      isSenior: c.isSenior,
      nextClassId: c.nextClass?.id ?? null,
    }));
  }

  async setNextClass(id: string, nextClassId: string | null) {
    const schoolClass = await this.classRepository.findOne({ where: { id } });
    if (!schoolClass) throw new NotFoundException('Class not found');
    if (nextClassId === id) throw new BadRequestException('A class cannot lead to itself');
    if (nextClassId && !(await this.classRepository.exists({ where: { id: nextClassId } }))) {
      throw new NotFoundException('Next class not found');
    }
    await this.classRepository.update(id, {
      nextClass: nextClassId ? ({ id: nextClassId } as SchoolClass) : null,
    });
    return { id, nextClassId };
  }

  async createDepartment(name: string) {
    const existing = await this.departmentRepository.findOne({ where: { name } });
    if (existing) throw new ConflictException('Department already exists');

    const department = this.departmentRepository.create({ name });
    return this.departmentRepository.save(department);
  }

  async deleteDepartment(id: string) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');

    const [students, subjects] = await Promise.all([
      this.departmentRepository.manager.count(Student, { where: { department: { id } } }),
      this.curriculumRepository.count({ where: { department: { id } } }),
    ]);
    if (students || subjects) {
      throw new ConflictException(
        `${department.name} is still used by ${students} student(s) and ${subjects} subject(s). Move them first.`,
      );
    }
    await this.departmentRepository.delete(id);
    return { id };
  }

  async getAllDepartments() {
    return this.departmentRepository.find({ order: { name: 'ASC' } });
  }

  async findTermById(id: string) {
    return this.termRepository.findOne({
      where: { id },
      relations: ['academicYear'],
    });
  }

  // For anything that writes results or reports into a term.
  async findOpenTermOrFail(id: string) {
    const term = await this.findTermById(id);
    if (!term) throw new NotFoundException('Term not found');
    if (term.status === TermStatus.CLOSED) {
      throw new ForbiddenException('This term is closed. Ask the admin to reopen it to make changes.');
    }
    return term;
  }

  async findClassById(id: string) {
    return this.classRepository.findOne({ where: { id } });
  }

  async findDepartmentById(id: string) {
    return this.departmentRepository.findOne({ where: { id } });
  }

  async createSubject(name: string) {
    const existing = await this.subjectRepository.findOne({ where: { name } });
    if (existing) throw new ConflictException('Subject already exists');

    const subject = this.subjectRepository.create({ name });
    return this.subjectRepository.save(subject);
  }

  async getAllSubjects() {
    return this.subjectRepository.find({ order: { name: 'ASC' } });
  }

  async createCurriculumMapping(schoolClassId: string, departmentId: string | null, subjectId: string) {
    const mapping = this.curriculumRepository.create({
      schoolClass: { id: schoolClassId } as any,
      department: departmentId ? { id: departmentId } as any : null,
      subject: { id: subjectId } as any,
    });
    return this.curriculumRepository.save(mapping);
  }

  async getMappedSubjects(schoolClassId: string, departmentId?: string | null) {
    // Always fetch subjects with no department (shared/general subjects for the class)
    const sharedWhere: any = { schoolClass: { id: schoolClassId }, department: IsNull() };

    if (departmentId) {
      // Fetch both department-specific and shared subjects, then deduplicate
      const deptWhere: any = { schoolClass: { id: schoolClassId }, department: { id: departmentId } };

      const [sharedMappings, deptMappings] = await Promise.all([
        this.curriculumRepository.find({ where: sharedWhere, relations: ['subject'] }),
        this.curriculumRepository.find({ where: deptWhere, relations: ['subject'] }),
      ]);

      const seen = new Set<string>();
      const combined = [...sharedMappings, ...deptMappings].filter(m => {
        if (seen.has(m.subject.id)) return false;
        seen.add(m.subject.id);
        return true;
      });

      return combined
        .map(m => m.subject)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // No department — return all subjects for the class regardless of department mapping
    const mappings = await this.curriculumRepository.find({
      where: { schoolClass: { id: schoolClassId } },
      relations: ['subject'],
      order: { subject: { name: 'ASC' } },
    });

    const seen = new Set<string>();
    return mappings
      .filter(m => { if (seen.has(m.subject.id)) return false; seen.add(m.subject.id); return true; })
      .map(m => m.subject);
  }
}
