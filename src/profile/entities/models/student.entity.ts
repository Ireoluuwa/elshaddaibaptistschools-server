import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../../users/entities/user.entity';

@Entity('student_profiles')
export class Student extends BaseEntity {
  @Column({ unique: true })
  admissionNumber: string;

  @Column()
  currentClass: string;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column()
  yearJoined: number;

  @Column({ type: 'text' })
  homeAddress: string;

  @Column()
  guardianName: string;

  @Column()
  guardianPhone: string;

  @Column({ nullable: true })
  guardianEmail: string;

  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
