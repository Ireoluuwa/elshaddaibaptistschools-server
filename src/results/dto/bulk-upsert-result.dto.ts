import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertResultDto } from './upsert-result.dto';

export class BulkUpsertResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertResultDto)
  results: UpsertResultDto[];
}
