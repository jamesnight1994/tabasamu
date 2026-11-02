import { ApiProperty } from '@nestjs/swagger';
import { StockUnitEntity } from '../../generated/nestjs-dto/stockUnit.entity';

export class StockUnitListResponseDto {
  @ApiProperty({ type: () => [StockUnitEntity] })
  items!: StockUnitEntity[];
}

export class StockPrintBatchResponseDto {
  @ApiProperty()
  batchId!: string;

  @ApiProperty({ type: () => [StockUnitEntity] })
  units!: StockUnitEntity[];

  @ApiProperty({ enum: ['nest'] })
  source!: 'nest';
}
