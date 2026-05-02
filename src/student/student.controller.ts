import { Controller, Get, Post, Body, UploadedFile, UseInterceptors, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
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

  @Post('manual')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ResponseMessage('Student enrolled successfully')
  async enrollStudent(@Body() dto: CreateStudentDto) {
    return this.studentService.enrollStudent(dto);
  }

  @Post('batch')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Batch enrollment processed successfully')
  async batchEnrollStudents(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No CSV file provided');
    }
    return this.studentService.batchEnrollStudents(file.buffer);
  }
}
