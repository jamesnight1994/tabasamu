import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockUnitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toApiStockUnit, type ApiStockUnit } from './stock-unit.mapper';
import { STOCK_COUNTING_STATUSES, assertTransition } from './stock-unit-status';

export type StockUnitSummary = {
  variantId: string | null;
  counts: Record<StockUnitStatus, number>;
  total: number;
};

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class StockUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: {
    status?: StockUnitStatus;
    variantId?: string;
    batchId?: string;
    limit?: number;
  }): Promise<{ items: ApiStockUnit[]; nextCursor: null }> {
    const units = await this.prisma.stockUnit.findMany({
      where: {
        status: filters.status,
        variantId: filters.variantId,
        batchId: filters.batchId,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 100,
    });
    return { items: units.map(toApiStockUnit), nextCursor: null };
  }

  async byCode(code: string): Promise<ApiStockUnit> {
    const unit = await this.prisma.stockUnit.findUnique({ where: { code } });
    if (!unit) throw new NotFoundException(`Stock unit not found: ${code}`);
    return toApiStockUnit(unit);
  }

  /** Counts grouped by status (optionally scoped to one variant). */
  async summary(variantId?: string): Promise<StockUnitSummary> {
    const grouped = await this.prisma.stockUnit.groupBy({
      by: ['status'],
      where: variantId ? { variantId } : undefined,
      _count: { _all: true },
    });

    const counts = Object.values(StockUnitStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<StockUnitStatus, number>,
    );
    let total = 0;
    for (const row of grouped) {
      counts[row.status] = row._count._all;
      total += row._count._all;
    }

    return { variantId: variantId ?? null, counts, total };
  }

  /**
   * Reconcile `variant.stockOnHand` to the number of `in_stock` units bound to
   * that variant. The unit ledger is the source of truth: callers that change
   * a unit's status (activate #22, fulfill #23, void #24) must call this after
   * the transition instead of hand-editing `stockOnHand`. Returns the new count.
   *
   * Pass the surrounding transaction client so the recount and the status
   * change commit atomically.
   */
  async syncVariantStock(
    variantId: string,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<number> {
    const onHand = await client.stockUnit.count({
      where: { variantId, status: { in: [...STOCK_COUNTING_STATUSES] } },
    });
    await client.variant.update({
      where: { id: variantId },
      data: { stockOnHand: onHand },
    });
    return onHand;
  }

  /**
   * Re-expose the shared status-machine guard so sibling services depend on the
   * module rather than reaching into the status helper directly.
   */
  assertTransition(from: StockUnitStatus, to: StockUnitStatus): void {
    assertTransition(from, to);
  }
}
