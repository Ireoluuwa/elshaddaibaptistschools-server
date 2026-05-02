import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
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
  ) {}

  async getDashboard(userId: string) {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass'],
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    //  Latest Assignments (Next 4 active assignments)
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

    // Latest Weekly Report
    const latestReport = await this.reportRepository.findOne({
      where: { 
        student: { id: student.id }, 
        status: ReportStatus.PUBLISHED 
      },
      order: { weekNumber: 'DESC' }
    });

    let weeklyReportScore: string | null = null;
    if (latestReport && latestReport.behavioralScore !== undefined) {
      weeklyReportScore = latestReport.behavioralScore.toFixed(1);
    }

    return {
      weeklyReport: {
        score: weeklyReportScore || '0.0',
        outOf: 5,
        message: latestReport?.teacherRemark || 'No remarks available for this week.',
      },
      latestAssignments: latestAssignments.map(a => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
      })),
      financeSummary: null,
      announcements: [],    
    };
  }

  async enrollStudent(dto: CreateStudentDto) {
    // 1. Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { username: dto.username } });
    if (existingUser) {
      throw new ConflictException(`Username ${dto.username} already exists`);
    }

    // 2. Fetch class and optional department
    const schoolClass = await this.classRepository.findOne({ where: { id: dto.classId } });
    if (!schoolClass) throw new NotFoundException('Class not found');

    let department = null;
    if (dto.departmentId) {
      department = await this.departmentRepository.findOne({ where: { id: dto.departmentId } });
      if (!department) throw new NotFoundException('Department not found');
    }

    // 3. Hash password
    const rawPassword = dto.password || 'password123'; // Default password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 4. Create User
    const user = this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      role: UserRole.STUDENT,
    });
    const savedUser = await this.userRepository.save(user);

    // 5. Create Student Profile
    const student = this.studentRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      schoolClass,
      department,
      user: savedUser,
      dateOfBirth: '2000-01-01', // Fallback defaults since manual UI doesn't have these
      yearJoined: new Date().getFullYear(),
      homeAddress: 'TBD',
      guardianName: 'TBD',
      guardianPhone: 'TBD',
    });

    return this.studentRepository.save(student);
  }

  async batchEnrollStudents(fileBuffer: Buffer) {
    // 1. Parse CSV
    const csvData = fileBuffer.toString('utf-8');
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException('Invalid CSV format. Please check headers and data.');
    }

    const rows = parsed.data as any[];
    
    // 2. Start a Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let enrolledCount = 0;

      for (const [index, row] of rows.entries()) {
        const rowNum = index + 2; // +1 for 0-index, +1 for header
        
        const { first_name, last_name, username, class: className, department: deptName } = row;

        if (!first_name || !last_name || !username || !className) {
          throw new BadRequestException(`Row ${rowNum}: Missing required fields (first_name, last_name, username, class).`);
        }

        // Check duplicates
        const existing = await queryRunner.manager.findOne(User, { where: { username } });
        if (existing) {
          throw new ConflictException(`Row ${rowNum}: Username '${username}' is already taken.`);
        }

        // Find Class
        const schoolClass = await queryRunner.manager.findOne(SchoolClass, { where: { name: className } });
        if (!schoolClass) {
          throw new NotFoundException(`Row ${rowNum}: Class '${className}' not found in the system.`);
        }

        // Find Department if provided
        let department = null;
        if (deptName && deptName.trim() !== '') {
          department = await queryRunner.manager.findOne(Department, { where: { name: deptName } });
          if (!department) {
            throw new NotFoundException(`Row ${rowNum}: Department '${deptName}' not found.`);
          }
        }

        // Hash Default Password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create User
        const user = queryRunner.manager.create(User, {
          username,
          password: hashedPassword,
          role: UserRole.STUDENT,
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create Profile
        const student = queryRunner.manager.create(Student, {
          firstName: first_name,
          lastName: last_name,
          schoolClass,
          department,
          user: savedUser,
          dateOfBirth: '2000-01-01',
          yearJoined: new Date().getFullYear(),
          homeAddress: 'TBD',
          guardianName: 'TBD',
          guardianPhone: 'TBD',
        });
        await queryRunner.manager.save(student);

        enrolledCount++;
      }

      // If loop completes without throwing, commit everything!
      await queryRunner.commitTransaction();
      return { message: `Successfully enrolled ${enrolledCount} students in batch.` };

    } catch (err) {
      // If ANY row fails, completely rollback the entire CSV upload
      await queryRunner.rollbackTransaction();
      throw err; // Send the exact row error back to the frontend
    } finally {
      // Release connection back to pool
      await queryRunner.release();
    }
  }
}
