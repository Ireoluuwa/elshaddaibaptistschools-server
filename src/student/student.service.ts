import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Assignment } from '../assignments/entities/assignment.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';
import { Student } from '../profile/entities/models/student.entity';
import { ReportStatus } from '../reports/enums/report-status.enum';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
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
}
