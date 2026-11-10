import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { StockUnitEntity } from '../generated/nestjs-dto/stockUnit.entity';
import { CreateStockBatchDto } from '../generated/nestjs-dto/create-stockBatch.dto';
import { ActivateStockUnitDto } from './dto/activate-stock-unit.dto';
import {
  StockPrintBatchResponseDto,
  StockUnitListResponseDto,
} from './dto/stock-print-batch-response.dto';
import { UpdateStockUnitStatusDto } from './dto/update-stock-unit-status.dto';
import { StockUnitsService } from './stock-units.service';

@ApiTags('admin/stock-units')
@ApiSecurity('admin-api-key')
@Controller('admin/stock-units')
@UseGuards(AdminApiKeyGuard)
export class AdminStockUnitsController {
  constructor(private readonly stockUnits: StockUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent stock units' })
  @ApiOkResponse({ type: StockUnitListResponseDto })
  async list() {
    return this.stockUnits.list();
  }

  @Post('batches')
  @ApiOperation({
    summary: 'Print a blank QR batch',
    description: 'Creates N unique codes in status printed. SKU is not bound here.',
  })
  @ApiCreatedResponse({ type: StockPrintBatchResponseDto })
  printBatch(@Body() dto: CreateStockBatchDto) {
    return this.stockUnits.printBatch(dto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get one stock unit by code' })
  @ApiOkResponse({ type: StockUnitEntity })
  byCode(@Param('code') code: string) {
    return this.stockUnits.byCode(code);
  }

  @Patch(':code')
  @ApiOperation({
    summary: 'Update StockUnit status (allowed transitions only)',
    description:
      'Matrix: printed→in_stock|void, in_stock→sold|void. sold/void are terminal (returns = new code). ' +
      'Entering/leaving in_stock recounts Variant.stockOnHand from in_stock units.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  updateStatus(@Param('code') code: string, @Body() dto: UpdateStockUnitStatusDto) {
    return this.stockUnits.updateStatus(code, dto);
  }

  @Post(':code/activate')
  @ApiOperation({
    summary: 'Activate on label scan',
    description: 'printed → in_stock and bind variantId. Syncs variant.stockOnHand via in_stock count.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  activate(@Param('code') code: string, @Body() dto: ActivateStockUnitDto) {
    return this.stockUnits.activate(code, dto);
  }

  @Post(':code/fulfill')
  @ApiOperation({
    summary: 'Fulfillment scan → sold',
    description: 'in_stock → sold. Required for online orders. Syncs stockOnHand via in_stock count.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  fulfill(@Param('code') code: string) {
    return this.stockUnits.fulfill(code);
  }

  @Post(':code/void')
  @ApiOperation({
    summary: 'Void a printed or in_stock label',
    description:
      'printed|in_stock → void. Voiding in_stock recounts stockOnHand. sold cannot be voided — print a new code for returns.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  voidUnit(@Param('code') code: string) {
    return this.stockUnits.void(code);
  }
}
