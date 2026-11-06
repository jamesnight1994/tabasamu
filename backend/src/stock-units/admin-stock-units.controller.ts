import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Post(':code/activate')
  @ApiOperation({
    summary: 'Activate on label scan',
    description: 'printed → in_stock and bind variantId. Syncs variant.stockOnHand up.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  activate(@Param('code') code: string, @Body() dto: ActivateStockUnitDto) {
    return this.stockUnits.activate(code, dto);
  }

  @Post(':code/fulfill')
  @ApiOperation({
    summary: 'Fulfillment scan → sold',
    description: 'in_stock → sold. Required for online orders. Syncs stockOnHand down.',
  })
  @ApiOkResponse({ type: StockUnitEntity })
  fulfill(@Param('code') code: string) {
    return this.stockUnits.fulfill(code);
  }
}
