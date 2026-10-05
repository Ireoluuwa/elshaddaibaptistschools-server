import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Teacher } from '../../profile/entities/models/teacher.entity';
import { User } from '../../users/entities/user.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserAccountsService } from '../accounts/user-accounts.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';

// Every new teacher starts with this; they can change it after signing in.
const DEFAULT_TEACHER_PASSWORD = '0000';

const cleared = (value: string | null | undefined) =>
  value === undefined ? undefined : value?.trim() || null;

@Injectable()
export class AdminTeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly accounts: UserAccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const teachers = await this.teacherRepository.find({
      relations: ['user', 'schoolClass'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
    return teachers.map((t) => this.toView(t));
  }

  async findOne(id: string) {
    return this.toView(await this.findTeacher(id));
  }

  async update(id: string, dto: UpdateStaffDto) {
    const teacher = await this.findTeacher(id);
    await this.dataSource.transaction(async (manager) => {
      if (dto.username !== undefined) {
        await this.accounts.changeUsername(
          teacher.user.id,
          dto.username.trim(),
          manager,
        );
      }
      const changes = {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        email: cleared(dto.email),
        phoneNumber: cleared(dto.phoneNumber),
        address: cleared(dto.address),
      };
      await manager.update(
        Teacher,
        { id },
        Object.fromEntries(
          Object.entries(changes).filter(([, v]) => v !== undefined),
        ),
      );
    });
    return this.findOne(id);
  }

  // Returns the default password so the admin can share the sign-in details.
  async create(dto: CreateStaffDto) {
    const username = dto.username.trim();
    if (await this.accounts.usernameTaken(username)) {
      throw new ConflictException(`Username ${username} is already in use`);
    }
    const password = DEFAULT_TEACHER_PASSWORD;
    const passwordHash = await this.accounts.hashPassword(password);

    const teacherId = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(
        manager.create(User, {
          username,
          password: passwordHash,
          role: UserRole.TEACHER,
        }),
      );
      const teacher = await manager.save(
        manager.create(Teacher, {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email?.trim() || undefined,
          phoneNumber: dto.phoneNumber?.trim() || undefined,
          user,
        }),
      );
      return teacher.id;
    });

    return {
      teacher: this.toView(await this.findTeacher(teacherId)),
      password,
    };
  }

  async assignClass(id: string, classId: string | null) {
    const teacher = await this.findTeacher(id);
    let schoolClass: SchoolClass | null = null;
    if (classId) {
      schoolClass = await this.dataSource.manager.findOne(SchoolClass, {
        where: { id: classId },
      });
      if (!schoolClass) throw new NotFoundException('Class not found');
    }
    teacher.schoolClass = schoolClass as SchoolClass;
    await this.teacherRepository.save(teacher);
    return this.toView(await this.findTeacher(id));
  }

  async setPassword(id: string, newPassword: string) {
    const teacher = await this.findTeacher(id);
    return this.accounts.setPassword(teacher.user.id, newPassword);
  }

  // Can't sign in and comes off their class, so it shows "No class teacher".
  async remove(id: string) {
    const teacher = await this.findTeacher(id);
    await this.dataSource.transaction(async (manager) => {
      await this.accounts.setActive(teacher.user.id, false, manager);
      await manager.update(
        Teacher,
        { id },
        { schoolClass: null as unknown as SchoolClass },
      );
    });
    return this.toView(await this.findTeacher(id));
  }

  async restore(id: string) {
    const teacher = await this.findTeacher(id);
    await this.accounts.setActive(teacher.user.id, true);
    return this.toView(await this.findTeacher(id));
  }

  async deletePermanently(id: string) {
    const teacher = await this.findTeacher(id);
    const assignments = await this.dataSource.manager.count(Assignment, {
      where: { teacher: { id: teacher.user.id } },
    });
    if (assignments) {
      throw new ConflictException(
        `${teacher.firstName} has posted ${assignments} assignment(s). Remove them instead so their work is kept.`,
      );
    }
    await this.dataSource.manager.delete(User, { id: teacher.user.id });
    return { id };
  }

  private async findTeacher(id: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'schoolClass'],
    });
    if (!teacher?.user) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  private toView(t: Teacher) {
    return {
      id: t.id,
      username: t.user.username,
      firstName: t.firstName ?? '',
      lastName: t.lastName ?? '',
      email: t.email || null,
      phoneNumber: t.phoneNumber || null,
      address: t.address || null,
      avatarUrl: t.avatarUrl || null,
      classId: t.schoolClass?.id ?? null,
      className: t.schoolClass?.name ?? null,
      isActive: t.user.isActive,
      lastLoginAt: t.user.lastLoginAt,
    };
  }
}
