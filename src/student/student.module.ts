import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from '../profile/entities/models/student.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Assignment, WeeklyReport])],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
