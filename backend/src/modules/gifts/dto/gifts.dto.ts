import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateGiftCampaignDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(240) description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(168) cooldownHours?: number;
}

export class ImportGiftItemsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500)
  @IsString({ each: true })
  items: string[];
}
