import { Type } from 'class-transformer';
import { Matches, ValidateNested } from 'class-validator';
import { CreateTermDto } from './create-term.dto';

export class CreateSessionDto {
  @Matches(/^\d{4}\/\d{4}$/, { message: 'name must look like 2026/2027' })
  name: string;

  @ValidateNested()
  @Type(() => CreateTermDto)
  firstTerm: CreateTermDto;
}
