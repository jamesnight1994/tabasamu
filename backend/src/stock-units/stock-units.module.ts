import { Module } from '@nestjs/common';
import { AdminStockUnitsController } from './admin-stock-units.controller';
import { StockUnitsService } from './stock-units.service';

@Module({
  controllers: [AdminStockUnitsController],
  providers: [StockUnitsService],
  exports: [StockUnitsService],
})
export class StockUnitsModule {}
