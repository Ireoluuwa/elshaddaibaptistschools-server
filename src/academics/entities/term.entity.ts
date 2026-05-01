// Term Entity
import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { AcademicYear } from './academic-year.entity';

@Entity('terms')
export class Term extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ default: false })
  isCurrent: boolean;

  @ManyToOne(() => AcademicYear, (academicYear: AcademicYear) => academicYear.terms, { onDelete: 'CASCADE' })
  academicYear: AcademicYear;
}
