import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType, ProductStatus } from '../../../schemas/product.schema';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CategoryDto {
  @IsString() @MinLength(2) @MaxLength(80)
  name: string;

  @IsString() @Matches(SLUG_PATTERN, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsOptional() @IsString() @MaxLength(240)
  description?: string;

  @IsOptional() @IsString() @MaxLength(40)
  iconType?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80)
  name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN)
  slug?: string;
  @IsOptional() @IsString() @MaxLength(240)
  description?: string;
  @IsOptional() @IsString() @MaxLength(40)
  iconType?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class ProductVariantDto {
  @IsString() @MinLength(1) @MaxLength(80)
  id: string;
  @IsString() @MinLength(1) @MaxLength(120)
  name: string;
  @IsOptional() @IsString() @MaxLength(80)
  sku?: string;
  @Type(() => Number) @IsNumber() @Min(0)
  price: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  originalPrice?: number;
  @IsOptional() @IsBoolean()
  promotionEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  discountPercent?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  stockCount?: number;
  @IsOptional() @IsBoolean()
  inStock?: boolean;
  @IsOptional() @IsString() @MaxLength(80)
  duration?: string;
  @IsOptional() @IsString() @MaxLength(120)
  deliveryLabel?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
}

class ProductFieldsDto {
  @IsOptional() @IsString() @MaxLength(80)
  categoryLabel?: string;
  @IsOptional() @IsString() @MaxLength(80)
  model?: string;
  @IsOptional() @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  originalPrice?: number;
  @IsOptional() @IsBoolean()
  promotionEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  discountPercent?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  soldCount?: number;
  @IsOptional() @IsString() @MaxLength(40)
  badge?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  stockCount?: number;
  @IsOptional() @IsBoolean()
  inStock?: boolean;
  @IsOptional() @IsString() @MaxLength(40)
  iconType?: string;
  @IsOptional() @IsString() @MaxLength(120)
  deliveryLabel?: string;
  @IsOptional() @IsBoolean()
  featured?: boolean;
  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  features?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  information?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  activationSteps?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true })
  warrantyNotes?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class CreateProductDto extends ProductFieldsDto {
  @IsString() @MinLength(3) @MaxLength(160)
  name: string;
  @IsString() @Matches(SLUG_PATTERN)
  slug: string;
  @IsString() @MinLength(1) @MaxLength(80)
  category: string;
  @IsString() @MinLength(10) @MaxLength(1200)
  description: string;
}

export class UpdateProductDto extends ProductFieldsDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(160)
  name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN)
  slug?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80)
  category?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(1200)
  description?: string;
}
