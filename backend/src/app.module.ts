import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { StockUnitsModule } from './stock-units/stock-units.module';

@Module({
  imports: [PrismaModule, ProductsModule, StockUnitsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
