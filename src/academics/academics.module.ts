import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolClass } from './entities/school-class.entity';
import { Department } from './entities/department.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { Term } from './entities/term.entity';
import { Subject } from './entities/subject.entity';
import { Curriculum } from './entities/curriculum.entity';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchoolClass,
      Department,
      AcademicYear,
      Term,
      Subject,
      Curriculum,
    ]),
  ],
  controllers: [AcademicsController],
  providers: [AcademicsService],
  exports: [AcademicsService],
})
export class AcademicsModule {}
