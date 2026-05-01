import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';

@Entity('school_classes')
export class SchoolClass extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: false })
  isSenior: boolean;

  @OneToMany(() => Student, (student) => student.schoolClass)
  students: Student[];
}
