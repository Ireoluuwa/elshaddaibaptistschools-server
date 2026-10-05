import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Term } from '../../academics/entities/term.entity';
import { Student } from '../../profile/entities/models/student.entity';

// What a student still owes for a term. Anything above zero holds their result.
@Entity('student_fees')
@Unique(['term', 'student'])
export class StudentFee extends BaseEntity {
  @ManyToOne(() => Term, { nullable: false, onDelete: 'CASCADE' })
  term: Term;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE' })
  student: Student;

  @Column({ type: 'int', default: 0 })
  outstanding: number;
}
