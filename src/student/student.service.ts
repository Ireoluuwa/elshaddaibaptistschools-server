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

    // 1. Latest Assignments (Next 3 active assignments)
    let latestAssignments = [];
    if (student.schoolClass) {
      latestAssignments = await this.assignmentRepository.find({
        where: {
          schoolClass: { id: student.schoolClass.id },
          dueDate: MoreThanOrEqual(new Date()), // Only show those not past due
        },
        order: { dueDate: 'ASC' }, // Closest deadline first
        take: 4,
      });
    }

    // 2. Weekly Report Average
    const latestReport = await this.reportRepository.findOne({
      where: { 
        student: { id: student.id }, 
        status: ReportStatus.PUBLISHED 
      },
      order: { weekNumber: 'DESC' }
    });

    let weeklyReportScore = null;
    if (latestReport && latestReport.scores && latestReport.scores.length > 0) {
      const totalScore = latestReport.scores.reduce((acc, curr) => acc + curr.score, 0);
      const maxScore = latestReport.scores.reduce((acc, curr) => acc + curr.total, 0);
      
      if (maxScore > 0) {
        // Convert to a scale out of 5 (e.g., 96/100 -> 4.8)
        weeklyReportScore = ((totalScore / maxScore) * 5).toFixed(1); 
      }
    }

    return {
      weeklyReport: {
        score: weeklyReportScore || '0.0',
        outOf: 5,
        message: 'Outstanding performance this week. Keep up the great work on your assignments!',
      },
      latestAssignments: latestAssignments.map(a => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
      })),
      financeSummary: null, // As requested
      announcements: [],    // As requested
    };
  }
}
