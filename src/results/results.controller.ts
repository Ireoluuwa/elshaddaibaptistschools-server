import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ResultsService } from './results.service';
import { UpsertResultDto } from './dto/upsert-result.dto';
import { BulkUpsertResultDto } from './dto/bulk-upsert-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Result saved successfully')
  async upsertResult(@Body() dto: UpsertResultDto) {
    return this.resultsService.upsertResult(dto);
  }

  @Post('bulk')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Results uploaded successfully')
  async bulkUpsertResults(@Body() dto: BulkUpsertResultDto) {
    return this.resultsService.bulkUpsertResults(dto);
  }

  @Get('init')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Dashboard initialized successfully')
  async getTeacherInit(@User() user: JwtPayload) {
    return this.resultsService.getTeacherInit(user.sub);
  }

  @Get('student')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Student result retrieved successfully')
  async getStudentResult(
    @Query('studentId') studentId: string,
    @Query('termId') termId: string,
  ) {
    return this.resultsService.getStudentResult(studentId, termId);
  }

  @Get('my-result')
  @Roles(UserRole.STUDENT)
  @ResponseMessage('Result retrieved successfully')
  async getMyResult(
    @User() user: JwtPayload,
    @Query('termId') termId?: string,
  ) {
    return this.resultsService.getMyResult(user.sub, termId);
  }

  @Get('subjects')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Subjects retrieved successfully')
  async getSubjectsForStudent(@Query('studentId') studentId: string) {
    return this.resultsService.getSubjectsForStudent(studentId);
  }
}
