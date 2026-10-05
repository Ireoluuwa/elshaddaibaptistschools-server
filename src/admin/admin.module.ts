import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { Staff } from '../profile/entities/models/staff.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { TerminalResult } from '../results/entities/terminal-result.entity';
import { Term } from '../academics/entities/term.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { AdminResultsController } from './results/admin-results.controller';
import { AdminResultsService } from './results/admin-results.service';
import { AdminPromotionsController } from './promotions/admin-promotions.controller';
import { AdminPromotionsService } from './promotions/admin-promotions.service';
import { AcademicYear } from '../academics/entities/academic-year.entity';
import { AdminStudentsController } from './students/admin-students.controller';
import { AdminStudentsService } from './students/admin-students.service';
import { UserAccountsService } from './accounts/user-accounts.service';
import { AdminTeachersController } from './teachers/admin-teachers.controller';
import { AdminTeachersService } from './teachers/admin-teachers.service';
import { AdminBursarsController } from './bursars/admin-bursars.controller';
import { AdminBursarsService } from './bursars/admin-bursars.service';

// Admin management of user accounts, results and promotion.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Teacher,
      Staff,
      TerminalResult,
      Term,
      SchoolClass,
      AcademicYear,
    ]),
    EnrollmentsModule,
  ],
  controllers: [
    AdminStudentsController,
    AdminTeachersController,
    AdminBursarsController,
    AdminResultsController,
    AdminPromotionsController,
  ],
  providers: [
    UserAccountsService,
    AdminStudentsService,
    AdminTeachersService,
    AdminBursarsService,
    AdminResultsService,
    AdminPromotionsService,
  ],
})
export class AdminModule {}
