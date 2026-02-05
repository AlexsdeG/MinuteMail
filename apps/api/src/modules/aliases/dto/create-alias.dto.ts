import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAliasDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'Slug can only contain alphanumeric characters, dots, dashes, and underscores' })
  slug?: string;
}