import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class ImportKeysDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  keys: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model: string;
}
