import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Student } from '../../profile/entities/models/student.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Student, (student) => student.user)
  studentProfile: Student;
}
