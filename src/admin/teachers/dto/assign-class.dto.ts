import { IsUUID, ValidateIf } from 'class-validator';

export class AssignClassDto {
  // null takes the teacher off their class.
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  classId: string | null;
}
