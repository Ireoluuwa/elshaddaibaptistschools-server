import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';
import { Term } from '../../academics/entities/term.entity';
import { ResultStatus } from '../enums/result-status.enum';
import { TerminalResultScore } from '../types/terminal-result-score.type';

@Entity('terminal_results')
@Unique(['student', 'term'])
export class TerminalResult extends BaseEntity {
  @ManyToOne(() => Student)
  student: Student;

  @ManyToOne(() => Term)
  term: Term;

  @Column({ type: 'jsonb', default: [] })
  scores: TerminalResultScore[];

  @Column({ type: 'int', default: 0 })
  daysAttended: number;

  @Column({ type: 'int', default: 65 })
  totalDays: number;

  @Column({ type: 'text', nullable: true })
  teacherRemark: string;

  @Column({
    type: 'enum',
    enum: ResultStatus,
    default: ResultStatus.DRAFT,
  })
  status: ResultStatus;
}
