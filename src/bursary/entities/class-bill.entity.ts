import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Term } from '../../academics/entities/term.entity';
import { SchoolClass } from '../../academics/entities/school-class.entity';

export interface BillCharge {
  name: string;
  amount: number;
}

// Fees for the next term, printed on this term's report sheets for the class.
@Entity('class_bills')
@Unique(['term', 'schoolClass'])
export class ClassBill extends BaseEntity {
  @ManyToOne(() => Term, { nullable: false, onDelete: 'CASCADE' })
  term: Term;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'CASCADE' })
  schoolClass: SchoolClass;

  @Column({ type: 'int', default: 0 })
  tuition: number;

  @Column({ type: 'int', default: 0 })
  ict: number;

  @Column({ type: 'jsonb', default: [] })
  otherCharges: BillCharge[];
}
