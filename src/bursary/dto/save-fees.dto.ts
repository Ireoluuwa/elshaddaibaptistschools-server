import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudentFeeDto {
  @IsUUID()
  studentId: string;

  @IsInt()
  @Min(0)
  outstanding: number;
}

export class SaveFeesDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => StudentFeeDto)
  fees: StudentFeeDto[];
}
