import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';
import { AcademicYear } from '../../academics/entities/academic-year.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';
import { Department } from '../../academics/entities/department.entity';
import { EnrollmentOutcome } from '../enums/enrollment-outcome.enum';

// The class a student was in for one session, so past results keep their class.
@Entity('enrollments')
@Unique(['student', 'academicYear'])
export class Enrollment extends BaseEntity {
  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  student: Student;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
  academicYear: AcademicYear;

  @ManyToOne(() => SchoolClass, { nullable: false })
  schoolClass: SchoolClass;

  @ManyToOne(() => Department, { nullable: true })
  department: Department | null;

  @Column({ type: 'enum', enum: EnrollmentOutcome, nullable: true })
  outcome: EnrollmentOutcome | null;

  // Department for next session, when promoted into a senior class.
  @ManyToOne(() => Department, { nullable: true })
  nextDepartment: Department | null;
}
