import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnitStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateStockUnitStatusDto {
  @ApiProperty({
    enum: StockUnitStatus,
    description:
      'Target status. Allowed: printed→in_stock|void, in_stock→sold|void. sold/void are terminal.',
  })
  @IsEnum(StockUnitStatus)
  status!: StockUnitStatus;

  @ApiPropertyOptional({
    description: 'Required when targeting in_stock (activate). Ignored for sold/void.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  variantId?: string;
}
