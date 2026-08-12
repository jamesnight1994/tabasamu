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
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('admin/products')
@ApiSecurity('admin-api-key')
@Controller('admin/products')
@UseGuards(AdminApiKeyGuard)
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products (admin)' })
  list(@Query('status') status?: string) {
    const parsed =
      status && Object.values(ProductStatus).includes(status as ProductStatus)
        ? (status as ProductStatus)
        : undefined;
    return this.products.list(parsed);
  }

  @Post()
  @ApiOperation({ summary: 'Create product (default status: draft)' })
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product fields' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish product → active',
    description: 'Requires descriptor + base; otherwise 422 with `{ message, missing }`.',
  })
  publish(@Param('id') id: string) {
    return this.products.publish(id);
  }
}
