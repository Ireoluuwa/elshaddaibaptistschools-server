import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/models/student.entity';
import { Teacher } from './entities/models/teacher.entity';
import { Staff } from './entities/models/staff.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
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
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
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

    if (!profile) return null;

    return {
      id: profile.id,
      studentId: profile.user.username,
      role: profile.user.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      schoolClass: profile.schoolClass?.name || null,
      department: profile.department?.name || null,
      dateOfBirth: profile.dateOfBirth,
      yearJoined: profile.yearJoined,
      homeAddress: profile.homeAddress,
      guardianName: profile.guardianName,
      guardianPhone: profile.guardianPhone,
      guardianEmail: profile.guardianEmail,
      avatarUrl: profile.avatarUrl || null,
    };
  }

  async getTeacherProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'schoolClass', 'department'],
    });

    if (!profile) return null;

    return {
      id: profile.id,
      username: profile.user.username,
      role: profile.user.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
      schoolClass: profile.schoolClass?.name || null,
      department: profile.department?.name || null,
      address: profile.address,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      avatarUrl: profile.avatarUrl || null,
    };
  }

  async updateStudentProfile(
    userId: string,
    updateDto: UpdateStudentProfileDto,
  ) {
    const profile = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    Object.assign(profile, updateDto);
    return this.studentRepository.save(profile);
  }

  async updateTeacherProfile(
    userId: string,
    updateDto: UpdateTeacherProfileDto,
  ) {
    const profile = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Teacher profile not found');
    }

    Object.assign(profile, updateDto);
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

  // Admins and bursars. A profile is made on first view if one doesn't exist yet.
  async getStaffProfile(userId: string) {
    const profile = await this.findOrCreateStaffProfile(userId);
    return this.toStaffView(profile);
  }

  async updateStaffProfile(
    userId: string,
    role: UserRole,
    dto: UpdateStaffProfileDto,
  ) {
    const profile = await this.findOrCreateStaffProfile(userId);
    if (dto.signatureUrl !== undefined && role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can set a signature');
    }
    const optional = (v: string | null | undefined) =>
      v === undefined ? undefined : v?.trim() || null;

    if (dto.firstName !== undefined) profile.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) profile.lastName = dto.lastName.trim();
    for (const key of [
      'title',
      'position',
      'email',
      'phoneNumber',
      'signatureUrl',
    ] as const) {
      const value = optional(dto[key]);
      if (value !== undefined) profile[key] = value;
    }
    return this.toStaffView(await this.staffRepository.save(profile));
  }

  private async findOrCreateStaffProfile(userId: string) {
    const existing = await this.staffRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (existing) return existing;

    const user = await this.staffRepository.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.staffRepository.save(
      this.staffRepository.create({ firstName: '', lastName: '', user }),
    );
  }

  private toStaffView(profile: Staff) {
    return {
      username: profile.user.username,
      role: profile.user.role,
      title: profile.title,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      signatureUrl: profile.signatureUrl,
    };
  }
}
