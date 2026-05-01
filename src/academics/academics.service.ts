import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { Department } from './entities/department.entity';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async createClass(name: string, isSenior: boolean) {
    const existing = await this.classRepository.findOne({ where: { name } });
    if (existing) throw new ConflictException('Class already exists');

    const schoolClass = this.classRepository.create({ name, isSenior });
    return this.classRepository.save(schoolClass);
  }

  async getAllClasses() {
    return this.classRepository.find({ order: { name: 'ASC' } });
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

  async findClassById(id: string) {
    return this.classRepository.findOne({ where: { id } });
  }

  async findDepartmentById(id: string) {
    return this.departmentRepository.findOne({ where: { id } });
  }
}
