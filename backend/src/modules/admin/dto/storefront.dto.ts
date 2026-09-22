import { IsBoolean, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';
export class UpdateStoreSettingsDto {
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) telegramUrl?: string;
  @IsOptional() @IsString() @MaxLength(80) telegramHandle?: string;
  @IsOptional() @IsString() @MaxLength(160) telegramDescription?: string;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) zaloUrl?: string;
  @IsOptional() @IsString() @MaxLength(80) zaloLabel?: string;
  @IsOptional() @IsString() @MaxLength(160) zaloDescription?: string;
  @IsOptional() @IsBoolean() contactEnabled?: boolean;
  @IsOptional() @IsBoolean() businessHoursEnabled?: boolean;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) restStart?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) restEnd?: string;
  @IsOptional() @IsString() @MaxLength(60) timeZone?: string;
}
export class CreateAnnouncementDto {
  @IsString() @MinLength(2) @MaxLength(80) title: string;
  @IsString() @MinLength(2) @MaxLength(600) message: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateAnnouncementDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(600) message?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
