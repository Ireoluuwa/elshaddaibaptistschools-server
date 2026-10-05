import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminalResult } from './entities/terminal-result.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { AcademicsModule } from '../academics/academics.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TerminalResult, Student, Teacher]),
    AcademicsModule,
    EnrollmentsModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
