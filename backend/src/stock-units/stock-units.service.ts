import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, StockUnitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockUnitEntity } from '../generated/nestjs-dto/stockUnit.entity';
import { CreateStockBatchDto } from '../generated/nestjs-dto/create-stockBatch.dto';
import { ActivateStockUnitDto } from './dto/activate-stock-unit.dto';
import { UpdateStockUnitStatusDto } from './dto/update-stock-unit-status.dto';
import { assertTransition } from './stock-unit-status';

const MIN_BATCH = 1;
const MAX_BATCH = 200;

type DbClient = Prisma.TransactionClient | PrismaService;

const toEntity = (row: {
  id: string;
  code: string;
  status: StockUnitStatus;
  variantId: string | null;
  batchId: string;
  createdAt: Date;
  updatedAt: Date;
  activatedAt: Date | null;
  soldAt: Date | null;
}): StockUnitEntity => {
  const entity = new StockUnitEntity();
  entity.id = row.id;
  entity.code = row.code;
  entity.status = row.status;
  entity.variantId = row.variantId;
  entity.batchId = row.batchId;
  entity.createdAt = row.createdAt;
  entity.updatedAt = row.updatedAt;
  entity.activatedAt = row.activatedAt;
  entity.soldAt = row.soldAt;
  return entity;
};

@Injectable()
export class StockUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<{ items: StockUnitEntity[] }> {
    const units = await this.prisma.stockUnit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: units.map(toEntity) };
  }

  async byCode(code: string): Promise<StockUnitEntity> {
    const unit = await this.prisma.stockUnit.findUnique({
      where: { code: code.trim() },
    });
    if (!unit) {
      throw new NotFoundException(
        'This code is not in the system. Check the print batch or try again.',
      );
    }
    return toEntity(unit);
  }

  async printBatch(dto: CreateStockBatchDto): Promise<{
    batchId: string;
    units: StockUnitEntity[];
    source: 'nest';
  }> {
    const size = dto.size;
    if (!Number.isInteger(size) || size < MIN_BATCH || size > MAX_BATCH) {
      throw new UnprocessableEntityException(
        `Enter a batch size between ${MIN_BATCH} and ${MAX_BATCH}.`,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.create({ data: { size } });
      await tx.stockUnit.createMany({
        data: Array.from({ length: size }, () => ({
          batchId: batch.id,
          status: StockUnitStatus.printed,
        })),
      });
      const units = await tx.stockUnit.findMany({
        where: { batchId: batch.id },
        orderBy: { createdAt: 'asc' },
      });
      return { batch, units };
    });

    return {
      batchId: created.batch.id,
      units: created.units.map(toEntity),
      source: 'nest',
    };
  }

  async activate(code: string, dto: ActivateStockUnitDto): Promise<StockUnitEntity> {
    return this.transition(code, {
      status: StockUnitStatus.in_stock,
      variantId: dto.variantId,
    });
  }

  async fulfill(code: string): Promise<StockUnitEntity> {
    return this.transition(code, { status: StockUnitStatus.sold });
  }

  async void(code: string): Promise<StockUnitEntity> {
    return this.transition(code, { status: StockUnitStatus.void });
  }

  async updateStatus(
    code: string,
    dto: UpdateStockUnitStatusDto,
  ): Promise<StockUnitEntity> {
    return this.transition(code, {
      status: dto.status,
      variantId: dto.variantId,
    });
  }

  /**
   * Derive Variant.stockOnHand from the count of in_stock units.
   * The unit ledger is the source of truth — do not dual-write ±1.
   */
  async syncVariantStock(variantId: string, tx: DbClient = this.prisma): Promise<void> {
    const count = await tx.stockUnit.count({
      where: { variantId, status: StockUnitStatus.in_stock },
    });
    await tx.variant.update({
      where: { id: variantId },
      data: { stockOnHand: count },
    });
  }

  private async transition(
    code: string,
    opts: { status: StockUnitStatus; variantId?: string },
  ): Promise<StockUnitEntity> {
    const nextStatus = opts.status;
    const requestedVariantId = opts.variantId?.trim();

    try {
      const unit = await this.prisma.$transaction(async (tx) => {
        const current = await tx.stockUnit.findUnique({
          where: { code: code.trim() },
        });
        if (!current) {
          throw new NotFoundException(
            'This code is not in the system. Check the print batch or try again.',
          );
        }

        assertTransition(current.status, nextStatus);

        let boundVariantId = current.variantId;

        if (nextStatus === StockUnitStatus.in_stock) {
          const variantId = requestedVariantId ?? current.variantId;
          if (!variantId) {
            throw new UnprocessableEntityException('Choose a valid product / SKU.');
          }
          const variant = await tx.variant.findUnique({ where: { id: variantId } });
          if (!variant) {
            throw new UnprocessableEntityException('Choose a valid product / SKU.');
          }
          boundVariantId = variantId;
        }

        const data: Prisma.StockUnitUpdateInput = {
          status: nextStatus,
        };

        if (nextStatus === StockUnitStatus.in_stock && boundVariantId) {
          data.variant = { connect: { id: boundVariantId } };
          data.activatedAt = new Date();
        }
        if (nextStatus === StockUnitStatus.sold) {
          data.soldAt = new Date();
        }

        const next = await tx.stockUnit.update({
          where: { id: current.id },
          data,
        });

        const variantsToSync = new Set<string>();
        if (current.variantId) variantsToSync.add(current.variantId);
        if (boundVariantId) variantsToSync.add(boundVariantId);
        for (const variantId of variantsToSync) {
          await this.syncVariantStock(variantId, tx);
        }

        return next;
      });
      return toEntity(unit);
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  private rethrowKnown(error: unknown): never {
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof UnprocessableEntityException
    ) {
      throw error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(
        'This code is not in the system. Check the print batch or try again.',
      );
    }
    throw error;
  }
}
