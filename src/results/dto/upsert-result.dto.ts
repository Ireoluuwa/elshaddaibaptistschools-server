import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResultStatus } from '../enums/result-status.enum';

export class TerminalResultScoreDto {
  @IsString()
  subjectName: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  test1: number;

  @IsNumber()
  @Min(0)
  @Max(15)
  test2: number;

  @IsNumber()
  @Min(0)
  @Max(70)
  exam: number;
}

export class UpsertResultDto {
  @IsString()
  studentId: string;

  @IsString()
  termId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalResultScoreDto)
  scores: TerminalResultScoreDto[];

  @IsNumber()
  @Min(0)
  daysAttended: number;

  @IsNumber()
  @Min(1)
  totalDays: number;

  @IsOptional()
  @IsString()
  teacherRemark?: string;

  @IsEnum(ResultStatus)
  status: ResultStatus;
}
