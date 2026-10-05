import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Teachers and bursars are created with the same details.
export class CreateStaffDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName: string;

  @Matches(/^[A-Za-z0-9._/-]{3,40}$/, {
    message: 'username can use letters, numbers and . _ / - (3–40 characters)',
  })
  username: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}
