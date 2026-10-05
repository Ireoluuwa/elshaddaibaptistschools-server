import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student } from '../profile/entities/models/student.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';
import { User } from '../users/entities/user.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { Department } from '../academics/entities/department.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Assignment,
      WeeklyReport,
      User,
      SchoolClass,
      Department,
    ]),
    EnrollmentsModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
