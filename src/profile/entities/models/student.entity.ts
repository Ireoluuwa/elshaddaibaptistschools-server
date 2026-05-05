import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../../users/entities/user.entity';
import { SchoolClass } from '../../../academics/entities/school-class.entity';
import { Department } from '../../../academics/entities/department.entity';

@Entity('student_profiles')
export class Student extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.students, { nullable: true })
  schoolClass: SchoolClass;

  @ManyToOne(() => Department, (department) => department.students, { nullable: true })
  department: Department;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({ nullable: true })
  yearJoined: number;

  @Column({ type: 'text', nullable: true })
  homeAddress: string;

  @Column({ nullable: true })
  guardianName: string;

  @Column({ nullable: true })
  guardianPhone: string;

  @Column({ nullable: true })
  guardianEmail: string;

  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
