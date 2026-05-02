import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsUUID()
  classId: string;
}
