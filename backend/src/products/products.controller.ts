import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List catalogue products' })
  list(@Query('status') status?: string) {
    const parsed = parseStatus(status);
    return this.products.list(parsed);
  }

  @Get(':slugOrId')
  @ApiOperation({ summary: 'Get product by slug or id' })
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
