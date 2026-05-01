import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../../users/entities/user.entity';
import { SchoolClass } from '../../../academics/entities/school-class.entity';
import { Department } from '../../../academics/entities/department.entity';

@Entity('teacher_profiles')
export class Teacher extends BaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @ManyToOne(() => SchoolClass, { nullable: true })
  schoolClass: SchoolClass;

  @ManyToOne(() => Department, { nullable: true })
  department: Department;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @OneToOne(() => User, (user) => user.teacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
