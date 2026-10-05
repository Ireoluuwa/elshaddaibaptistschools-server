import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Student } from '../../profile/entities/models/student.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';
import { Department } from '../../academics/entities/department.entity';
import { TerminalResult } from '../../results/entities/terminal-result.entity';
import { WeeklyReport } from '../../reports/entities/weekly-report.entity';
import { User } from '../../users/entities/user.entity';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import { EnrollmentOutcome } from '../../enrollments/enums/enrollment-outcome.enum';
import { UserAccountsService } from '../accounts/user-accounts.service';
import { ChangeClassDto } from './dto/change-class.dto';

export type StudentStatus = 'active' | 'graduated' | 'removed';

// Enrollment fills unknown fields with 'TBD'; report those as missing.
const provided = (value?: string | null) =>
  value && value.trim() && value.trim().toUpperCase() !== 'TBD'
    ? value.trim()
    : null;

@Injectable()
export class AdminStudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly accounts: UserAccountsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const [students, graduated] = await Promise.all([
      this.studentRepository.find({
        relations: ['user', 'schoolClass', 'department'],
        order: { lastName: 'ASC', firstName: 'ASC' },
      }),
      this.enrollmentsService.graduatedStudentIds(),
    ]);
    return students.map((s) => this.toListItem(s, graduated.has(s.id)));
  }

  async findOne(id: string) {
    const student = await this.findStudent(id);
    const history = await this.enrollmentsService.historyFor(id);
    const graduated = history.some(
      (e) => e.outcome === EnrollmentOutcome.GRADUATED,
    );

    return {
      ...this.toListItem(student, graduated),
      dateOfBirth: student.dateOfBirth,
      yearJoined: student.yearJoined ?? null,
      homeAddress: provided(student.homeAddress),
      guardianName: provided(student.guardianName),
      guardianPhone: provided(student.guardianPhone),
      guardianEmail: provided(student.guardianEmail),
      avatarUrl: student.avatarUrl ?? null,
      enrollments: history.map((e) => ({
        session: e.academicYear.name,
        isCurrentSession: e.academicYear.isCurrent,
        className: e.schoolClass.name,
        department: e.department?.name ?? null,
        outcome: e.outcome,
      })),
    };
  }

  async setPassword(id: string, newPassword: string) {
    const student = await this.findStudent(id);
    return this.accounts.setPassword(student.user.id, newPassword);
  }

  // Moves the student now and corrects their class for the current session.
  async changeClass(id: string, dto: ChangeClassDto) {
    const student = await this.findStudent(id);
    const schoolClass = await this.dataSource.manager.findOne(SchoolClass, {
      where: { id: dto.classId },
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    let department: Department | null = null;
    if (schoolClass.isSenior) {
      if (!dto.departmentId) {
        throw new BadRequestException(
          `Choose a department for ${schoolClass.name}`,
        );
      }
      department = await this.dataSource.manager.findOne(Department, {
        where: { id: dto.departmentId },
      });
      if (!department) throw new NotFoundException('Department not found');
    }

    await this.dataSource.transaction(async (manager) => {
      student.schoolClass = schoolClass;
      student.department = department as Department;
      await manager.save(student);
      await this.enrollmentsService.enrollInCurrentSession(manager, student);
    });
    return this.findOne(id);
  }

  // Hidden from teachers and can't sign in; results are kept.
  async remove(id: string) {
    const student = await this.findStudent(id);
    await this.dataSource.transaction(async (manager) => {
      await this.accounts.setActive(student.user.id, false, manager);
      await this.enrollmentsService.setCurrentOutcome(
        manager,
        student.id,
        EnrollmentOutcome.WITHDRAWN,
      );
    });
    return this.findOne(id);
  }

  async restore(id: string) {
    const student = await this.findStudent(id);
    await this.dataSource.transaction(async (manager) => {
      await this.accounts.setActive(student.user.id, true, manager);
      await this.enrollmentsService.setCurrentOutcome(
        manager,
        student.id,
        null,
      );
    });
    return this.findOne(id);
  }

  // Only for students added by mistake: anyone with results must be removed instead.
  async deletePermanently(id: string) {
    const student = await this.findStudent(id);
    const [results, reports] = await Promise.all([
      this.dataSource.manager.count(TerminalResult, {
        where: { student: { id } },
      }),
      this.dataSource.manager.count(WeeklyReport, {
        where: { student: { id } },
      }),
    ]);
    if (results || reports) {
      throw new ConflictException(
        `${student.firstName} has ${results} result(s) and ${reports} weekly report(s). Remove them instead so their records are kept.`,
      );
    }
    await this.dataSource.manager.delete(User, { id: student.user.id });
    return { id };
  }

  private async findStudent(id: string) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'schoolClass', 'department'],
    });
    if (!student?.user) throw new NotFoundException('Student not found');
    return student;
  }

  private toListItem(student: Student, graduated: boolean) {
    const status: StudentStatus = graduated
      ? 'graduated'
      : student.user?.isActive === false
        ? 'removed'
        : 'active';
    return {
      id: student.id,
      username: student.user?.username ?? '',
      firstName: student.firstName,
      lastName: student.lastName,
      className: student.schoolClass?.name ?? null,
      department: student.department?.name ?? null,
      status,
    };
  }
}
