import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../../users/entities/user.entity';

// Profile for staff without a class: bursars and admins.
@Entity('staff_profiles')
export class Staff extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @OneToOne(() => User, (user) => user.staffProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
