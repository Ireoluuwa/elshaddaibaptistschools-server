import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsModule } from '../academics/academics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeeklyReport, Student, Teacher]),
    AcademicsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
