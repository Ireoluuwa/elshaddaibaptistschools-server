import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsService } from '../academics/academics.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from './enums/report-status.enum';

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

  async submitReport(dto: CreateReportDto) {
    const { studentId, termId, weekNumber, ...reportData } = dto;

    // Find the term and its academic year
    const term = await this.academicsService.findTermById(termId);

    // Check if report already exists for this student/term/week
    let report: WeeklyReport;
    const existingReport = await this.reportRepository.findOne({
      where: {
        student: { id: studentId },
        term: { id: termId },
        weekNumber,
      },
    });

    if (existingReport) {
      // Update existing
      report = existingReport;
      Object.assign(report, reportData);
    } else {
      // Create new
      const student = await this.studentRepository.findOne({ where: { id: studentId } });

      report = this.reportRepository.create({
        student: student || undefined,
        term: term || undefined,
        weekNumber,
        ...reportData,
      });
    }

    return this.reportRepository.save(report);
  }

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
      relations: ['user'],
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

    // Get all reports for this student in this term
    const reports = await this.reportRepository.find({
      where: { student: { id: studentId }, term: { id: termId } },
      order: { weekNumber: 'ASC' },
    });

    // Generate timeline
    const timeline: any[] = [];
    for (let i = 1; i <= currentWeek; i++) {
      const report = reports.find((r) => r.weekNumber === i);
      timeline.push({
        week: i,
        reportId: report?.id || null,
        status: report?.status || 'NEW',
      });
    }

    // Get data for the current week report if it exists
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

  async getStudentDashboard(userId: string, termId?: string) {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) throw new NotFoundException('Student not found');
    const active = await this.academicsService.getCurrentTerm();
    const periods = await this.academicsService.getAllPeriods();

    const targetTermId = termId || active?.id;
    if (!targetTermId) return { periods, active, timeline: [] };

    const reports = await this.reportRepository.find({
      where: {
        student: { id: student.id },
        term: { id: targetTermId },
        status: ReportStatus.PUBLISHED,
      },
      order: { weekNumber: 'ASC' },
    });

    const reportMap = reports.reduce((acc, r) => {
      acc[r.weekNumber] = r.id;
      return acc;
    }, {} as Record<number, string>);

    const timeline: any[] = [];
    for (let i = 1; i <= 12; i++) {
      timeline.push({
        week: i,
        reportId: reportMap[i] || null,
        isAvailable: !!reportMap[i],
      });
    }

    return {
      periods,
      activeTermId: active?.id || null,
      selectedTermId: targetTermId,
      timeline,
    };
  }
}
