import { IsString, IsOptional, IsEmail, IsDateString, IsNumber } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsNumber()
  yearJoined?: number;

  @IsOptional()
  @IsString()
  homeAddress?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsEmail()
  @IsOptional()
  guardianEmail?: string;
}
