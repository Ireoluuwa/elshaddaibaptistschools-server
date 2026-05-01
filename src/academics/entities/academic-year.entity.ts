// Academic Year Entity
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Term } from './term.entity';

@Entity('academic_years')
export class AcademicYear extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: false })
  isCurrent: boolean;

  @OneToMany(() => Term, (term: Term) => term.academicYear)
  terms: Term[];
}
