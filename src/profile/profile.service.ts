import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/models/student.entity';
import { Teacher } from './entities/models/teacher.entity';
import { UsersService } from '../users/users.service';
import { AcademicsService } from '../academics/academics.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly usersService: UsersService,
    private readonly academicsService: AcademicsService,
  ) {}

  async getStudentProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'schoolClass', 'department'],
    });

    return profile;
  }

  async getTeacherProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'schoolClass'],
    });

    return profile;
  }

  async updateStudentProfile(userId: string, updateDto: UpdateStudentProfileDto) {
    const profile = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    const { classId, departmentId, ...otherData } = updateDto;

    if (classId) {
      const schoolClass = await this.academicsService.findClassById(classId);
      if (schoolClass) profile.schoolClass = schoolClass;
    }

    if (departmentId) {
      const department = await this.academicsService.findDepartmentById(departmentId);
      if (department) profile.department = department;
    }

    Object.assign(profile, otherData);
    return this.studentRepository.save(profile);
  }

  async updateTeacherProfile(userId: string, updateDto: UpdateTeacherProfileDto) {
    const profile = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    const { classId, ...otherData } = updateDto;

    if (classId) {
      const schoolClass = await this.academicsService.findClassById(classId);
      if (schoolClass) profile.schoolClass = schoolClass;
    }

    Object.assign(profile, otherData);
    return this.teacherRepository.save(profile);
  }

  async updatePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersService.update(userId, { password: hashedPassword });

    return { message: 'Password updated successfully' };
  }
}
