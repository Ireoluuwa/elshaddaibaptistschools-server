import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { Department } from './entities/department.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { Term } from './entities/term.entity';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolClass, Department, AcademicYear, Term]),
  ],
  controllers: [AcademicsController],
  providers: [AcademicsService],
  exports: [AcademicsService],
})
export class AcademicsModule {}
