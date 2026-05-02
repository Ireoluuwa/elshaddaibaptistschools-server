import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('dashboard')
  @Roles(UserRole.STUDENT)
  @ResponseMessage('Student dashboard retrieved successfully')
  async getDashboard(@User() user: JwtPayload) {
    return this.studentService.getDashboard(user.sub);
  }
}
