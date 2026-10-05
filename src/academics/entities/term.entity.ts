import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { AcademicYear } from './academic-year.entity';
import { TermStatus } from '../enums/term-status.enum';

@Entity('terms')
export class Term extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'enum', enum: TermStatus, default: TermStatus.UPCOMING })
  status: TermStatus;

  // Kept in sync with status (true only while ACTIVE); many queries still read it.
  @Column({ default: false })
  isCurrent: boolean;

  // Printed on every report sheet for this term.
  @Column({ type: 'text', nullable: true })
  signatureUrl: string | null;

  @Column({ type: 'date', nullable: true })
  signedDate: string | null;

  @Column({ type: 'date', nullable: true })
  vacationDate: string | null;

  @Column({ type: 'date', nullable: true })
  resumptionDate: string | null;

  @ManyToOne(() => AcademicYear, (academicYear: AcademicYear) => academicYear.terms, { onDelete: 'CASCADE' })
  academicYear: AcademicYear;
}
