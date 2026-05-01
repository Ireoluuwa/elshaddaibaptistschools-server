import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Student } from './entities/models/student.entity';
import { Teacher } from './entities/models/teacher.entity';
import { UsersModule } from '../users/users.module';
import { AcademicsModule } from '../academics/academics.module';
 
 @Module({
   imports: [
     TypeOrmModule.forFeature([Student, Teacher]),
     UsersModule,
     AcademicsModule,
   ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
