import { IsDateString, IsOptional, IsUrl, ValidateIf } from 'class-validator';

// Send null to clear a field.
export class UpdateReportDetailsDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ require_tld: false })
  signatureUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  signedDate?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  vacationDate?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  resumptionDate?: string | null;
}
