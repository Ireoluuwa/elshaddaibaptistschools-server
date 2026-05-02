import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password?: string; // Default password logic can be handled if not provided

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;
}
