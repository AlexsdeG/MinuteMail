import { IsIn, IsOptional } from 'class-validator';

export class ExtendAliasDto {
  @IsOptional()
  @IsIn(['10min', '1hour', '1day', '1week', '1month'])
  duration?: string = '1hour';
}
