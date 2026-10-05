import { IsUUID, ValidateIf } from 'class-validator';

export class SetNextClassDto {
  // null means students graduate from this class.
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  nextClassId: string | null;
}
