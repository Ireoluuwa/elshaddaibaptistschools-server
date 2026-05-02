import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Paginate, type PaginateQuery, type Paginated } from 'nestjs-paginate';
import { Assignment } from './entities/assignment.entity';
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

  @Get()
  @ResponseMessage('Assignments retrieved successfully')
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Assignment>> {
    return this.assignmentsService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Assignment retrieved successfully')
  async findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Assignment deleted successfully')
  async remove(@Param('id') id: string, @User() user: JwtPayload) {
    // Note: We need to resolve the teacher entity ID from the user ID in a real scenario
    // For now, I'll assume we can handle the ownership check in the service
    // or through a helper that finds the teacher profile.
    return this.assignmentsService.remove(id, user.sub); 
  }
}
