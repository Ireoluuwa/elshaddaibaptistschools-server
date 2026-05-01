import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';
import { Term } from '../../academics/entities/term.entity';
import { ReportStatus } from '../enums/report-status.enum';
import { WeeklyScore } from '../types/weekly-score.type';

@Entity('weekly_reports')
@Unique(['student', 'term', 'weekNumber'])
export class WeeklyReport extends BaseEntity {
  @ManyToOne(() => Student)
  student: Student;


  @ManyToOne(() => Term)
  term: Term;

  @Column()
  weekNumber: number;

  @Column({ type: 'jsonb', default: [] })
  scores: WeeklyScore[];

  @Column({ type: 'text', nullable: true })
  teacherRemark: string;

  @Column({ type: 'int', default: 0 })
  behavioralScore: number;

  @Column({ type: 'int', default: 5 })
  attendance: number;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;
}
