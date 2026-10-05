import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EnrollmentOutcome } from '../../../enrollments/enums/enrollment-outcome.enum';

export class PromotionDecisionDto {
  @IsUUID()
  studentId: string;

  @IsEnum(EnrollmentOutcome)
  outcome: EnrollmentOutcome;

  // Required when promoting from a junior class into a senior one.
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class SavePromotionsDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => PromotionDecisionDto)
  decisions: PromotionDecisionDto[];
}
