import { IsString, MaxLength, ValidateIf } from 'class-validator';

export class VpRemarkDto {
  // null or "" clears the remark.
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(300)
  vpRemark: string | null;
}
