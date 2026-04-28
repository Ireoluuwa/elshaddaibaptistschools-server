import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  BURSAR = 'bursar',
  VP = 'vp',
  ADMIN = 'admin',
}

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
}
