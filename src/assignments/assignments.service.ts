import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, FilterOperator, type Paginated, type PaginateConfig, type PaginateQuery } from 'nestjs-paginate';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { User } from '../users/entities/user.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { Student } from '../profile/entities/models/student.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateAssignmentDto, userId: string) {
    const teacher = await this.userRepository.findOne({ where: { id: userId } });
    if (!teacher) throw new NotFoundException('User not found');

    const schoolClass = await this.classRepository.findOne({ where: { id: dto.classId } });
    if (!schoolClass) throw new NotFoundException('Class not found');

    const assignment = this.assignmentRepository.create({
      ...dto,
      teacher,
      schoolClass,
    });

    return this.assignmentRepository.save(assignment);
  }

  async update(id: string, dto: Partial<CreateAssignmentDto>, userId: string) {
    const assignment = await this.findOne(id);
    
    // Ownership check
    if (assignment.teacher.id !== userId) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    if (dto.classId) {
      const schoolClass = await this.classRepository.findOne({ where: { id: dto.classId } });
      if (!schoolClass) throw new NotFoundException('Class not found');
      assignment.schoolClass = schoolClass;
    }

    Object.assign(assignment, dto);
    return this.assignmentRepository.save(assignment);
  }

  public static paginateConfig: PaginateConfig<Assignment> = {
    sortableColumns: ['id', 'title', 'dueDate', 'startDate'],
    nullSort: 'last',
    defaultSortBy: [['dueDate', 'DESC']],
    searchableColumns: ['title', 'description'],
    select: ['id', 'title', 'description', 'startDate', 'dueDate', 'attachmentUrl'],
    filterableColumns: {
      'schoolClass.id': true,
      'teacher.id': true,
      dueDate: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT, FilterOperator.EQ],
      startDate: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT, FilterOperator.EQ],
    },
  };

  async findAll(query: PaginateQuery): Promise<Paginated<Assignment>> {
    return paginate(query, this.assignmentRepository, AssignmentsService.paginateConfig);
  }

  async findAllForTeacher(query: PaginateQuery, userId: string): Promise<Paginated<Assignment>> {
    const queryBuilder = this.assignmentRepository.createQueryBuilder('assignment')
      .leftJoin('assignment.teacher', 'teacher')
      .where('teacher.id = :userId', { userId });

    return paginate(query, queryBuilder, AssignmentsService.paginateConfig);
  }

  async findAllForStudent(query: PaginateQuery, userId: string): Promise<Paginated<Assignment>> {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass'],
    });

    if (!student || !student.schoolClass) {
      throw new NotFoundException('Student or assigned class not found');
    }

    const queryBuilder = this.assignmentRepository.createQueryBuilder('assignment')
      .leftJoin('assignment.schoolClass', 'schoolClass')
      .where('schoolClass.id = :classId', { classId: student.schoolClass.id });

    return paginate(query, queryBuilder, AssignmentsService.paginateConfig);
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['teacher', 'schoolClass'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async remove(id: string, userId: string) {
    const assignment = await this.findOne(id);
    
    // Ownership check
    if (assignment.teacher.id !== userId) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    return this.assignmentRepository.remove(assignment);
  }
}
