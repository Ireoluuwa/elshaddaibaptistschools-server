import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, Paginated, PaginateConfig, PaginateQuery } from 'nestjs-paginate';
import { Assignment } from './entities/assignment.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {}

  public static paginateConfig: PaginateConfig<Assignment> = {
    sortableColumns: ['id', 'title', 'dueDate', 'startDate'],
    nullSort: 'last',
    defaultSortBy: [['dueDate', 'DESC']],
    searchableColumns: ['title', 'description'],
    select: ['id', 'title', 'description', 'startDate', 'dueDate', 'attachmentUrl'],
    filterableColumns: {
      'schoolClass.id': true,
      'teacher.id': true,
    },
    relations: ['teacher', 'schoolClass'],
  };

  async findAll(query: PaginateQuery): Promise<Paginated<Assignment>> {
    return paginate(query, this.assignmentRepository, AssignmentsService.paginateConfig);
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['teacher', 'schoolClass'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async remove(id: string, teacherId: string) {
    const assignment = await this.findOne(id);
    
    // Ensure only the creator can delete
    if (assignment.teacher.id !== teacherId) {
      throw new ForbiddenException('You can only delete your own assignments');
    }

    return this.assignmentRepository.remove(assignment);
  }
}
