import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsService } from '../academics/academics.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly academicsService: AcademicsService,
  ) {}

  async getDashboardInit(userId: string) {
  
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: userId } },
      relations: ['schoolClass'],
    });

    if (!teacher || !teacher.schoolClass) {
      throw new NotFoundException('Teacher or assigned class not found');
    }


    const active = await this.academicsService.getCurrentTerm();


    const students = await this.studentRepository.find({
      where: { schoolClass: { id: teacher.schoolClass.id } },
      order: { firstName: 'ASC' },
    });

   
    const periods = await this.academicsService.getAllPeriods();

    return {
      activePeriod: {
        termId: active?.id || null,
        yearId: active?.academicYear?.id || null,
        week: active?.currentWeek || 1,
      },
      classInfo: {
        id: teacher.schoolClass.id,
        name: teacher.schoolClass.name,
      },
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        studentId: s.user?.username || 'N/A',
      })),
      periods,
    };
  }

  async getStudentWeeklyInit(studentId: string, termId: string) {
    //  Get student info
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['schoolClass', 'department'],
    });

    if (!student) throw new NotFoundException('Student not found');

    //Get active period for week calculation
    const activeTerm = await this.academicsService.getCurrentTerm();
    const currentWeek = activeTerm?.id === termId ? activeTerm.currentWeek : 12;

    // 3. Get all reports for this student in this term
    const reports = await this.reportRepository.find({
      where: { student: { id: studentId }, term: { id: termId } },
      order: { weekNumber: 'ASC' },
    });

    // 4. Generate timeline
    const timeline: any[] = [];
    for (let i = 1; i <= currentWeek; i++) {
      const report = reports.find((r) => r.weekNumber === i);
      timeline.push({
        week: i,
        reportId: report?.id || null,
        status: report?.status || 'NEW',
      });
    }

    // 5. Get data for the current week report if it exists
    const activeReport = reports.find((r) => r.weekNumber === currentWeek);

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        class: `${student.schoolClass?.name || ''} ${student.department?.name || ''}`.trim(),
        studentId: student.user?.username || 'N/A',
      },
      timeline,
      activeReport: activeReport || null,
    };
  }

  async getReportById(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
