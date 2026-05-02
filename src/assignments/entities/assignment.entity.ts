import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Teacher } from '../../profile/entities/models/teacher.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';

@Entity('assignments')
export class Assignment extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ nullable: true })
  attachmentUrl: string;

  @ManyToOne(() => Teacher)
  teacher: Teacher;

  @ManyToOne(() => SchoolClass)
  schoolClass: SchoolClass;
}
