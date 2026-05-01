import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-init')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Dashboard initialized successfully')
  async getDashboardInit(@User() user: JwtPayload) {
    return this.reportsService.getDashboardInit(user.sub);
  }

  @Get('student-weekly-init')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Student weekly history retrieved successfully')
  async getStudentWeeklyInit(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string,
  ) {
    return this.reportsService.getStudentWeeklyInit(studentId, termId);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  @ResponseMessage('Report retrieved successfully')
  async getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }
}
