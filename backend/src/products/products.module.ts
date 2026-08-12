import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { InventoryController } from '../inventory/inventory.controller';

@Module({
  controllers: [ProductsController, AdminProductsController, InventoryController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
