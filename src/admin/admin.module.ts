import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../profile/entities/models/student.entity';
import { Teacher } from '../profile/entities/models/teacher.entity';
import { Staff } from '../profile/entities/models/staff.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { AdminStudentsController } from './students/admin-students.controller';
import { AdminStudentsService } from './students/admin-students.service';
import { UserAccountsService } from './accounts/user-accounts.service';

// Admin management of every kind of user account.
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Student, Teacher, Staff]),
    EnrollmentsModule,
  ],
  controllers: [AdminStudentsController],
  providers: [UserAccountsService, AdminStudentsService],
})
export class AdminModule {}
