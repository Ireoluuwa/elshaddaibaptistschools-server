import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, ILike, Repository } from 'typeorm';
import { Curriculum } from '../entities/curriculum.entity';
import { Department } from '../entities/department.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { Subject } from '../entities/subject.entity';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

const byName = (a: string, b: string) => a.localeCompare(b);

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepository: Repository<Curriculum>,
    private readonly dataSource: DataSource,
  ) {}

  async getSubjectCatalog() {
    const subjects = await this.subjectRepository.find({
      order: { name: 'ASC' },
    });
    return subjects.map((s) => s.name);
  }

  async getForClass(classId: string) {
    const schoolClass = await this.findClass(classId);
    const [mappings, departments] = await Promise.all([
      this.curriculumRepository.find({
        where: { schoolClass: { id: classId } },
        relations: ['department', 'subject'],
      }),
      schoolClass.isSenior
        ? this.departmentRepository.find({ order: { name: 'ASC' } })
        : Promise.resolve<Department[]>([]),
    ]);

    // Older seed data mapped some subjects twice; list each once.
    const subjectsFor = (departmentId: string | null) =>
      [
        ...new Set(
          mappings
            .filter((m) => (m.department?.id ?? null) === departmentId)
            .map((m) => m.subject.name),
        ),
      ].sort(byName);

    return {
      classId: schoolClass.id,
      className: schoolClass.name,
      isSenior: schoolClass.isSenior,
      common: subjectsFor(null),
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        subjects: subjectsFor(d.id),
      })),
    };
  }

  // Replaces the class's whole subject list; new subject names are created.
  async replaceForClass(classId: string, dto: UpdateCurriculumDto) {
    const schoolClass = await this.findClass(classId);
    if (!schoolClass.isSenior && dto.departments.length) {
      throw new BadRequestException('Junior classes do not have departments');
    }

    const common = this.clean(dto.common);
    const commonKeys = new Set(common.map((n) => n.toLowerCase()));
    // A subject everyone takes doesn't also belong under a department.
    const perDepartment = dto.departments.map((d) => ({
      departmentId: d.departmentId,
      subjects: this.clean(d.subjects).filter(
        (n) => !commonKeys.has(n.toLowerCase()),
      ),
    }));

    const departmentIds = perDepartment.map((d) => d.departmentId);
    if (departmentIds.length) {
      const found = await this.departmentRepository.countBy(
        departmentIds.map((id) => ({ id })),
      );
      if (found !== new Set(departmentIds).size)
        throw new NotFoundException('Department not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Curriculum, { schoolClass: { id: classId } });

      const rows: Partial<Curriculum>[] = [];
      for (const name of common) {
        rows.push({
          schoolClass,
          department: null,
          subject: await this.findOrCreateSubject(manager, name),
        });
      }
      for (const { departmentId, subjects } of perDepartment) {
        for (const name of subjects) {
          rows.push({
            schoolClass,
            department: { id: departmentId } as Department,
            subject: await this.findOrCreateSubject(manager, name),
          });
        }
      }
      if (rows.length) await manager.save(Curriculum, rows);
    });

    return this.getForClass(classId);
  }

  private async findClass(id: string) {
    const schoolClass = await this.classRepository.findOne({ where: { id } });
    if (!schoolClass) throw new NotFoundException('Class not found');
    return schoolClass;
  }

  // Trim, drop blanks and case-insensitive duplicates.
  private clean(names: string[]) {
    const seen = new Set<string>();
    return names
      .map((n) => n.trim().replace(/\s+/g, ' '))
      .filter(
        (n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()),
      );
  }

  // Matches an existing subject regardless of case, so "english" reuses "English".
  private async findOrCreateSubject(manager: EntityManager, name: string) {
    const existing = await manager.findOne(Subject, {
      where: { name: ILike(name) },
    });
    return existing ?? manager.save(manager.create(Subject, { name }));
  }
}
