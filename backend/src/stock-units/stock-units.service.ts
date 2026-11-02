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

const MIN_BATCH = 1;
const MAX_BATCH = 200;

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
      throw new NotFoundException('This code is not in the system. Check the print batch or try again.');
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
    const variantId = dto.variantId.trim();
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new UnprocessableEntityException('Choose a valid product / SKU.');
    }

    try {
      const unit = await this.prisma.$transaction(async (tx) => {
        const current = await tx.stockUnit.findUnique({ where: { code: code.trim() } });
        if (!current) {
          throw new NotFoundException(
            'This code is not in the system. Check the print batch or try again.',
          );
        }
        this.assertActivatable(current.status);

        const next = await tx.stockUnit.update({
          where: { id: current.id },
          data: {
            status: StockUnitStatus.in_stock,
            variantId,
            activatedAt: new Date(),
          },
        });
        await tx.variant.update({
          where: { id: variantId },
          data: { stockOnHand: { increment: 1 } },
        });
        return next;
      });
      return toEntity(unit);
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async fulfill(code: string): Promise<StockUnitEntity> {
    try {
      const unit = await this.prisma.$transaction(async (tx) => {
        const current = await tx.stockUnit.findUnique({ where: { code: code.trim() } });
        if (!current) {
          throw new NotFoundException(
            'This code is not in the system. Check the print batch or try again.',
          );
        }
        this.assertFulfillable(current.status);

        const next = await tx.stockUnit.update({
          where: { id: current.id },
          data: {
            status: StockUnitStatus.sold,
            soldAt: new Date(),
          },
        });
        if (current.variantId) {
          await tx.variant.update({
            where: { id: current.variantId },
            data: { stockOnHand: { decrement: 1 } },
          });
        }
        return next;
      });
      return toEntity(unit);
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  private assertActivatable(status: StockUnitStatus): void {
    if (status === StockUnitStatus.in_stock) {
      throw new ConflictException('This bottle is already activated and in stock.');
    }
    if (status === StockUnitStatus.sold) {
      throw new ConflictException('This bottle is already marked sold.');
    }
    if (status === StockUnitStatus.void) {
      throw new UnprocessableEntityException('This code has been voided. Print a new label.');
    }
  }

  private assertFulfillable(status: StockUnitStatus): void {
    if (status === StockUnitStatus.printed) {
      throw new UnprocessableEntityException(
        'This label was never activated. Bind a SKU before fulfilling.',
      );
    }
    if (status === StockUnitStatus.sold) {
      throw new ConflictException('This bottle is already marked sold.');
    }
    if (status === StockUnitStatus.void) {
      throw new UnprocessableEntityException('This code has been voided. Print a new label.');
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
      throw new NotFoundException('This code is not in the system. Check the print batch or try again.');
    }
    throw error;
  }
}
