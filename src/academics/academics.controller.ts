// Academics Controller to manage classes and departments
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
}
