import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ReportStatus } from '../enums/report-status.enum';
import { WeeklyScore } from '../types/weekly-score.type';

export class CreateReportDto {
  @IsString()
  studentId: string;

  @IsString()
  termId: string;

  @IsNumber()
  weekNumber: number;

  @IsOptional()
  @IsArray()
  scores?: WeeklyScore[];

  @IsOptional()
  @IsString()
  teacherRemark?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  behavioralScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(7)
  attendance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
