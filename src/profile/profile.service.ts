import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/models/student.entity';
import { UsersService } from '../users/users.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly usersService: UsersService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    return profile;
  }

  async updateProfile(userId: string, updateDto: UpdateStudentProfileDto) {
    const profile = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    Object.assign(profile, updateDto);
    return this.studentRepository.save(profile);
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
