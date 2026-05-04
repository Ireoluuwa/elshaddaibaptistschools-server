import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Post('classes')
  @ResponseMessage('Class created successfully')
  async createClass(@Body() body: { name: string; isSenior: boolean }) {
    return this.academicsService.createClass(body.name, body.isSenior);
  }

  @Get('classes')
  @ResponseMessage('Classes retrieved successfully')
  async getAllClasses() {
    return this.academicsService.getAllClasses();
  }

  @Post('departments')
  @ResponseMessage('Department created successfully')
  async createDepartment(@Body() body: { name: string }) {
    return this.academicsService.createDepartment(body.name);
  }

  @Get('departments')
  @ResponseMessage('Departments retrieved successfully')
  async getAllDepartments() {
    return this.academicsService.getAllDepartments();
  }

  @Post('academic-years')
  @ResponseMessage('Academic year created successfully')
  async createAcademicYear(@Body() body: { name: string; isCurrent: boolean }) {
    return this.academicsService.createAcademicYear(body.name, body.isCurrent);
  }

  @Post('terms')
  @ResponseMessage('Term created successfully')
  async createTerm(
    @Body()
    body: {
      name: string;
      startDate: string;
      endDate: string;
      academicYearId: string;
      isCurrent: boolean;
    },
  ) {
    return this.academicsService.createTerm(
      body.name,
      body.startDate,
      body.endDate,
      body.academicYearId,
      body.isCurrent,
    );
  }

  @Get('active-period')
  @ResponseMessage('Active period retrieved successfully')
  async getActivePeriod() {
    return this.academicsService.getCurrentTerm();
  }

  @Get('all-periods')
  @ResponseMessage('All academic periods retrieved successfully')
  async getAllPeriods() {
    return this.academicsService.getAllPeriods();
  }

  @Post('subjects')
  @ResponseMessage('Subject created successfully')
  async createSubject(@Body() body: { name: string }) {
    return this.academicsService.createSubject(body.name);
  }

  @Get('subjects')
  @ResponseMessage('Subjects retrieved successfully')
  async getAllSubjects() {
    return this.academicsService.getAllSubjects();
  }

  @Post('curriculum')
  @ResponseMessage('Curriculum mapping created successfully')
  async createCurriculumMapping(
    @Body() body: { schoolClassId: string; departmentId?: string; subjectId: string },
  ) {
    return this.academicsService.createCurriculumMapping(
      body.schoolClassId,
      body.departmentId || null,
      body.subjectId,
    );
  }

  @Get('subjects/mapped')
  @ResponseMessage('Mapped subjects retrieved successfully')
  async getMappedSubjects(
    @Query('classId') classId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.academicsService.getMappedSubjects(classId, departmentId);
  }
}
