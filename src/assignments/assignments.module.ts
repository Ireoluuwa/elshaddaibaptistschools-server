import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, Teacher, SchoolClass])],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
