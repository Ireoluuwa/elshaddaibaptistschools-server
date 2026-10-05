import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassBill } from './entities/class-bill.entity';
import { StudentFee } from './entities/student-fee.entity';
import { Term } from '../academics/entities/term.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { AcademicYear } from '../academics/entities/academic-year.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { BursaryController } from './bursary.controller';
import { BursaryService } from './bursary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassBill,
      StudentFee,
      Term,
      SchoolClass,
      AcademicYear,
    ]),
    EnrollmentsModule,
  ],
  controllers: [BursaryController],
  providers: [BursaryService],
  exports: [BursaryService],
})
export class BursaryModule {}
