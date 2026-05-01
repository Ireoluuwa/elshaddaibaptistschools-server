import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../common/decorators/user.decorator';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('student')
  @Roles(UserRole.STUDENT)
  getStudentProfile(@User() user: any) {
    return this.profileService.getStudentProfile(user.sub);
  }

  @Patch('student')
  @Roles(UserRole.STUDENT)
  updateStudentProfile(
    @User() user: any,
    @Body() updateDto: UpdateStudentProfileDto,
  ) {
    return this.profileService.updateStudentProfile(user.sub, updateDto);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  getTeacherProfile(@User() user: any) {
    return this.profileService.getTeacherProfile(user.sub);
  }

  @Patch('teacher')
  @Roles(UserRole.TEACHER)
  updateTeacherProfile(
    @User() user: any,
    @Body() updateDto: UpdateTeacherProfileDto,
  ) {
    return this.profileService.updateTeacherProfile(user.sub, updateDto);
  }

  @Patch('change-password')
  updatePassword(
    @User() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.updatePassword(user.sub, changePasswordDto);
  }
}
