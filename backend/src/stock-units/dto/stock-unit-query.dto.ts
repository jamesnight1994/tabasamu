import { StockUnitStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListStockUnitsQueryDto {
  @IsOptional()
  @IsEnum(StockUnitStatus)
  status?: StockUnitStatus;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class StockUnitSummaryQueryDto {
  @IsOptional()
  @IsString()
  variantId?: string;
}
