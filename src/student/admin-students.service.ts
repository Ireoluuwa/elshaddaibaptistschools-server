import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../profile/entities/models/student.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { EnrollmentOutcome } from '../enrollments/enums/enrollment-outcome.enum';

export type StudentStatus = 'active' | 'graduated' | 'withdrawn';

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
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'schoolClass', 'department'],
    });
    if (!student) throw new NotFoundException('Student not found');

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

  private toListItem(student: Student, graduated: boolean) {
    const status: StudentStatus = graduated
      ? 'graduated'
      : student.user?.isActive === false
        ? 'withdrawn'
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
