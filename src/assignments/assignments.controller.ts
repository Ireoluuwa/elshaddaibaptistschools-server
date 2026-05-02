import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Paginate, type PaginateQuery, type Paginated } from 'nestjs-paginate';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Assignment created successfully')
  async create(@Body() dto: CreateAssignmentDto, @User() user: JwtPayload) {
    return this.assignmentsService.create(dto, user.sub);
  }

  @Get('student')
  @Roles(UserRole.STUDENT)
  @ResponseMessage('Student assignments retrieved successfully')
  async getStudentAssignments(@Paginate() query: PaginateQuery, @User() user: JwtPayload): Promise<Paginated<Assignment>> {
    return this.assignmentsService.findAllForStudent(query, user.sub);
  }

  @Get()
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Assignments retrieved successfully')
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Assignment>> {
    return this.assignmentsService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Assignment retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Assignment updated successfully')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAssignmentDto>,
    @User() user: JwtPayload,
  ) {
    return this.assignmentsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Assignment deleted successfully')
  async remove(@Param('id') id: string, @User() user: JwtPayload) {
    return this.assignmentsService.remove(id, user.sub); 
  }
}
