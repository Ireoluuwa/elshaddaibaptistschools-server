import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
