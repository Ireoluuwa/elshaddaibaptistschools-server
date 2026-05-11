import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { Department } from './entities/department.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { Term } from './entities/term.entity';
import { Subject } from './entities/subject.entity';
import { Curriculum } from './entities/curriculum.entity';

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

  async createAcademicYear(name: string, isCurrent: boolean) {
    if (isCurrent) {
      await this.academicYearRepository.update({}, { isCurrent: false });
    }
    const academicYear = this.academicYearRepository.create({ name, isCurrent });
    return this.academicYearRepository.save(academicYear);
  }

  async createTerm(
    name: string,
    startDate: string,
    endDate: string,
    academicYearId: string,
    isCurrent: boolean,
  ) {
    if (isCurrent) {
      await this.termRepository.update({}, { isCurrent: false });
    }
    const term = this.termRepository.create({
      name,
      startDate,
      endDate,
      isCurrent,
      academicYear: { id: academicYearId } as any,
    });
    return this.termRepository.save(term);
  }

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
    return this.classRepository.find({ 
      select: ['id', 'name'],
      order: { name: 'ASC' } 
    });
  }

  async createDepartment(name: string) {
    const existing = await this.departmentRepository.findOne({ where: { name } });
    if (existing) throw new ConflictException('Department already exists');

    const department = this.departmentRepository.create({ name });
    return this.departmentRepository.save(department);
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
    const query: any = { schoolClass: { id: schoolClassId } };
    
    if (departmentId) {
      query.department = { id: departmentId };
    } else {
      query.department = IsNull();
    }

    const mappings = await this.curriculumRepository.find({
      where: query,
      relations: ['subject'],
      order: { subject: { name: 'ASC' } }
    });

    return mappings.map(m => m.subject);
  }
}
