import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../../users/entities/user.entity';

// Profile for staff without a class: bursars and admins.
@Entity('staff_profiles')
export class Staff extends BaseEntity {
  // e.g. Mr, Mrs, Dr.
  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string | null;

  // e.g. Vice Principal.
  @Column({ type: 'varchar', nullable: true })
  position: string | null;

  // Admins only: used on report sheets.
  @Column({ type: 'text', nullable: true })
  signatureUrl: string | null;

  @OneToOne(() => User, (user) => user.staffProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
