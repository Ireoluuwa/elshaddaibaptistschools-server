import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BillChargeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsInt()
  @Min(0)
  amount: number;
}

export class SaveBillDto {
  @IsInt()
  @Min(0)
  tuition: number;

  @IsInt()
  @Min(0)
  ict: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillChargeDto)
  otherCharges: BillChargeDto[];
}
