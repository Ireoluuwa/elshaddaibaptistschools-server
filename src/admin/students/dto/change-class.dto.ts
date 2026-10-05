import { IsOptional, IsUUID } from 'class-validator';

export class ChangeClassDto {
  @IsUUID()
  classId: string;

  // Required for senior classes, ignored for junior ones.
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
