import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class DepartmentSubjectsDto {
  @IsUUID()
  departmentId: string;

  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  subjects: string[];
}

export class UpdateCurriculumDto {
  // Taken by every student in the class, whatever their department.
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  common: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentSubjectsDto)
  departments: DepartmentSubjectsDto[];
}
