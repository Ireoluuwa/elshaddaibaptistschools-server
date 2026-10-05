import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Student } from '../../profile/entities/models/student.entity';

@Entity('school_classes')
export class SchoolClass extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: false })
  isSenior: boolean;

  // Where promoted students go; null means students graduate from this class.
  @ManyToOne(() => SchoolClass, { nullable: true, onDelete: 'SET NULL' })
  nextClass: SchoolClass | null;

  @OneToMany(() => Student, (student) => student.schoolClass)
  students: Student[];
}
