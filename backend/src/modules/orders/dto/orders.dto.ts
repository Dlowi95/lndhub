import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Matches(/^[0-9a-f]{24}$/i, { message: 'productId không hợp lệ' })
  productId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  variantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  @IsOptional()
  @IsIn(['BANK_TRANSFER'])
  paymentMethod?: 'BANK_TRANSFER';
}

export class LookupOrderDto {
  @IsString()
  @MinLength(20)
  @MaxLength(160)
  token: string;
}

export class ReportPaymentDto extends LookupOrderDto {}

export class FulfillOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  deliveryContent: string;
}
