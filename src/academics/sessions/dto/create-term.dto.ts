import { IsBoolean, IsDateString, IsIn, IsOptional } from 'class-validator';

export const TERM_NAMES = ['1st Term', '2nd Term', '3rd Term'] as const;

export class CreateTermDto {
  @IsIn(TERM_NAMES)
  name: (typeof TERM_NAMES)[number];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  makeActive?: boolean;
}
