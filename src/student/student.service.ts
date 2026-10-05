import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  MoreThanOrEqual,
  DataSource,
  EntityManager,
} from 'typeorm';
import { Assignment } from '../assignments/entities/assignment.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';
import { Student } from '../profile/entities/models/student.entity';
import { ReportStatus } from '../reports/enums/report-status.enum';
import { User } from '../users/entities/user.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { Department } from '../academics/entities/department.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import * as Papa from 'papaparse';
import { EnrollmentsService } from '../enrollments/enrollments.service';

const USERNAME_PREFIX = 'EBS/STU/';
// Every new student starts with this; they can change it after signing in.
const DEFAULT_STUDENT_PASSWORD = '1234';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly dataSource: DataSource,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async getDashboard(userId: string) {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass'],
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    let latestAssignments: Assignment[] = [];
    if (student.schoolClass) {
      latestAssignments = await this.assignmentRepository.find({
        where: {
          schoolClass: { id: student.schoolClass.id },
          dueDate: MoreThanOrEqual(new Date()),
        },
        order: { dueDate: 'ASC' },
        take: 4,
      });
    }

    const latestReport = await this.reportRepository.findOne({
      where: {
        student: { id: student.id },
        status: ReportStatus.PUBLISHED,
      },
      order: { weekNumber: 'DESC' },
    });

    let weeklyReportScore: string | null = null;
    if (latestReport && latestReport.behavioralScore !== undefined) {
      weeklyReportScore = latestReport.behavioralScore.toFixed(1);
    }

    return {
      weeklyReport: {
        score: weeklyReportScore || '0.0',
        outOf: 5,
        message:
          latestReport?.teacherRemark || 'No remarks available for this week.',
      },
      latestAssignments: latestAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
      })),
      financeSummary: null,
      announcements: [],
    };
  }

  async enrollStudent(dto: CreateStudentDto) {
    const schoolClass = await this.classRepository.findOne({
      where: { id: dto.classId },
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    let department: Department | null = null;
    if (dto.departmentId) {
      department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId },
      });
      if (!department) throw new NotFoundException('Department not found');
    }

    const [created] = await this.createStudents([
      {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        schoolClass,
        department,
      },
    ]);
    return created;
  }

  async batchEnrollStudents(fileBuffer: Buffer) {
    const parsed = Papa.parse<Record<string, string>>(
      fileBuffer.toString('utf-8'),
      {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      },
    );
    if (parsed.errors.length > 0) {
      throw new BadRequestException(
        'Invalid CSV format. Please check headers and data.',
      );
    }

    // Check every row before creating anyone.
    const [classes, departments] = await Promise.all([
      this.classRepository.find(),
      this.departmentRepository.find(),
    ]);
    const newStudents = parsed.data.map((row, index) => {
      const rowNum = index + 2;
      const firstName = row.first_name?.trim();
      const lastName = row.last_name?.trim();
      const className = row.class?.trim();
      const deptName = row.department?.trim();

      if (!firstName || !lastName || !className) {
        throw new BadRequestException(
          `Row ${rowNum}: first_name, last_name and class are required.`,
        );
      }
      const schoolClass = classes.find(
        (c) => c.name.toLowerCase() === className.toLowerCase(),
      );
      if (!schoolClass) {
        throw new NotFoundException(
          `Row ${rowNum}: Class '${className}' not found in the system.`,
        );
      }
      const department = deptName
        ? departments.find(
            (d) => d.name.toLowerCase() === deptName.toLowerCase(),
          )
        : null;
      if (deptName && !department) {
        throw new NotFoundException(
          `Row ${rowNum}: Department '${deptName}' not found.`,
        );
      }
      return {
        firstName,
        lastName,
        schoolClass,
        department: department ?? null,
      };
    });

    if (!newStudents.length)
      throw new BadRequestException('The CSV file has no students in it.');

    const students = await this.createStudents(newStudents);
    return { enrolled: students.length, students };
  }

  // Creates accounts with generated usernames and the default password, in one transaction.
  private async createStudents(
    newStudents: {
      firstName: string;
      lastName: string;
      schoolClass: SchoolClass;
      department: Department | null;
    }[],
  ) {
    const passwordHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);

    return this.dataSource.transaction(async (manager) => {
      const usernames = await this.nextUsernames(manager, newStudents.length);

      const created: {
        id: string;
        firstName: string;
        lastName: string;
        className: string;
        department: string | null;
        username: string;
        password: string;
      }[] = [];

      for (const [i, s] of newStudents.entries()) {
        const user = await manager.save(
          manager.create(User, {
            username: usernames[i],
            password: passwordHash,
            role: UserRole.STUDENT,
          }),
        );
        const student = await manager.save(
          manager.create(Student, {
            firstName: s.firstName,
            lastName: s.lastName,
            schoolClass: s.schoolClass,
            department: s.department ?? undefined,
            user,
            dateOfBirth: '2000-01-01',
            yearJoined: new Date().getFullYear(),
            homeAddress: 'TBD',
            guardianName: 'TBD',
            guardianPhone: 'TBD',
          }),
        );
        await this.enrollmentsService.enrollInCurrentSession(manager, student);
        created.push({
          id: student.id,
          firstName: s.firstName,
          lastName: s.lastName,
          className: s.schoolClass.name,
          department: s.department?.name ?? null,
          username: usernames[i],
          password: DEFAULT_STUDENT_PASSWORD,
        });
      }
      return created;
    });
  }

  // Next numbers in the EBS/STU/### sequence. The lock stops two enrollments
  // running at the same time from getting the same number.
  private async nextUsernames(manager: EntityManager, count: number) {
    await manager.query(
      `SELECT pg_advisory_xact_lock(hashtext('student-usernames'))`,
    );
    const [{ max }] = await manager.query(
      `SELECT COALESCE(MAX(CAST(substring(username FROM '^${USERNAME_PREFIX}([0-9]+)$') AS int)), 0) AS max
       FROM users WHERE username ~ '^${USERNAME_PREFIX}[0-9]+$'`,
    );
    return Array.from(
      { length: count },
      (_, i) =>
        `${USERNAME_PREFIX}${String(Number(max) + i + 1).padStart(3, '0')}`,
    );
  }
}
