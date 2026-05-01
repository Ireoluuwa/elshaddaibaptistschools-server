import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ unique: true })
  name: string; 

  @OneToMany(() => Student, (student) => student.department)
  students: Student[];
}
