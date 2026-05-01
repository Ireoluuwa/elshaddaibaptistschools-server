import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ReportStatus } from '../enums/report-status.enum';

export class CreateReportDto {
  @IsString()
  studentId: string;

  @IsString()
  termId: string;

  @IsNumber()
  weekNumber: number;

  @IsOptional()
  @IsArray()
  scores?: any[];

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

  @IsEnum(ReportStatus)
  status: ReportStatus;
}
