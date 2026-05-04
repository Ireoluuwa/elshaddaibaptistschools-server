import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('subjects')
export class Subject extends BaseEntity {
  @Column({ unique: true })
  name: string;
}
