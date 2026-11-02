import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ActivateStockUnitDto {
  @ApiProperty({
    description: 'Variant / SKU to bind at activate. Not set at print.',
  })
  @IsString()
  @MinLength(1)
  variantId!: string;
}
