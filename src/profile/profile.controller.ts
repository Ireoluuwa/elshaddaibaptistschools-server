import { Controller, Get, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('student')
  @Roles(UserRole.STUDENT)
  @ResponseMessage('Student profile retrieved successfully')
  getStudentProfile(@User() user: JwtPayload) {
    return this.profileService.getStudentProfile(user.sub);
  }

  @Patch('student')
  @Roles(UserRole.STUDENT)
  @ResponseMessage('Student profile updated successfully')
  updateStudentProfile(
    @User() user: JwtPayload,
    @Body() updateDto: UpdateStudentProfileDto,
  ) {
    return this.profileService.updateStudentProfile(user.sub, updateDto);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Teacher profile retrieved successfully')
  getTeacherProfile(@User() user: JwtPayload) {
    return this.profileService.getTeacherProfile(user.sub);
  }

  @Patch('teacher')
  @Roles(UserRole.TEACHER)
  @ResponseMessage('Teacher profile updated successfully')
  updateTeacherProfile(
    @User() user: JwtPayload,
    @Body() updateDto: UpdateTeacherProfileDto,
  ) {
    return this.profileService.updateTeacherProfile(user.sub, updateDto);
  }

  @Post('change-password')
  @ResponseMessage('Password updated successfully')
  updatePassword(
    @User() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.updatePassword(user.sub, changePasswordDto);
  }
}
