import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query('status') status?: string) {
    const parsed = parseStatus(status);
    return this.products.list(parsed);
  }

  @Get(':slugOrId')
  async getOne(@Param('slugOrId') slugOrId: string) {
    try {
      return await this.products.bySlug(slugOrId);
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      return this.products.byId(slugOrId);
    }
  }
}

function parseStatus(status?: string): ProductStatus | undefined {
  if (!status) return undefined;
  if (Object.values(ProductStatus).includes(status as ProductStatus)) {
    return status as ProductStatus;
  }
  return undefined;
}
