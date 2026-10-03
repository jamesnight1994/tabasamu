import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import {
  ListStockUnitsQueryDto,
  StockUnitSummaryQueryDto,
} from './dto/stock-unit-query.dto';
import { StockUnitsService } from './stock-units.service';

/**
 * Read-only admin surface for serialized stock units (#20). Lifecycle
 * transitions (activate #22, fulfill #23, void #24) and batch print (#21)
 * land as sibling endpoints.
 */
@ApiTags('admin/stock-units')
@ApiSecurity('admin-api-key')
@Controller('admin/stock-units')
@UseGuards(AdminApiKeyGuard)
export class AdminStockUnitsController {
  constructor(private readonly stockUnits: StockUnitsService) {}

  @Get()
  @ApiOperation({
    summary: 'List stock units (filter by status/variant/batch)',
  })
  list(@Query() query: ListStockUnitsQueryDto) {
    return this.stockUnits.list(query);
  }

  // Static route declared before the `:code` param route so it is matched first.
  @Get('summary')
  @ApiOperation({
    summary: 'Stock-unit counts by status (optionally per variant)',
  })
  summary(@Query() query: StockUnitSummaryQueryDto) {
    return this.stockUnits.summary(query.variantId);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get a stock unit by its opaque code' })
  byCode(@Param('code') code: string) {
    return this.stockUnits.byCode(code);
  }
}
