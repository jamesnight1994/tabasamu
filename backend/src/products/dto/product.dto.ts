import { ProductStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  sizeCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  millilitres?: number;

  @IsOptional()
  @IsInt()
  priceAmount?: number | null;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  compareAt?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockOnHand?: number;
}

export class CreateImageDto {
  @IsString()
  src!: string;

  @IsString()
  alt!: string;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  flavour?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  subscriptionEligible?: boolean;

  @IsOptional()
  @IsString()
  descriptor?: string | null;

  @IsOptional()
  @IsString()
  base?: string | null;

  @IsOptional()
  @IsString()
  forwardNote?: string | null;

  @IsOptional()
  seo?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateImageDto)
  images?: CreateImageDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  flavour?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  subscriptionEligible?: boolean;

  @IsOptional()
  @IsString()
  descriptor?: string | null;

  @IsOptional()
  @IsString()
  base?: string | null;

  @IsOptional()
  @IsString()
  forwardNote?: string | null;

  @IsOptional()
  seo?: Record<string, unknown> | null;
}
