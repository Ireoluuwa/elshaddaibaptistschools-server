import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTermDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
