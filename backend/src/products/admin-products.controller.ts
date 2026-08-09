import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('admin/products')
@UseGuards(AdminApiKeyGuard)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query('status') status?: string) {
    const parsed =
      status && Object.values(ProductStatus).includes(status as ProductStatus)
        ? (status as ProductStatus)
        : undefined;
    return this.products.list(parsed);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.products.publish(id);
  }
}
