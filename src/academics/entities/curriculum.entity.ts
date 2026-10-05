import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { SchoolClass } from './school-class.entity';
import { Department } from './department.entity';
import { Subject } from './subject.entity';

@Entity('curriculum_mappings')
export class Curriculum extends BaseEntity {
  @ManyToOne(() => SchoolClass)
  schoolClass: SchoolClass;

  // null = every student in the class takes it.
  @ManyToOne(() => Department, { nullable: true })
  department: Department | null;

  @ManyToOne(() => Subject)
  subject: Subject;
}
