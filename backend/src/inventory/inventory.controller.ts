import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':variantId')
  async get(@Param('variantId') variantId: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException(`Variant not found: ${variantId}`);

    const reserved = 0;
    const onHand = variant.stockOnHand;
    return {
      variantId: variant.id,
      onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
      lowStockThreshold: {
        available: false,
        decision: 'D-27',
        note: 'Low-stock threshold has not been supplied.',
      },
      policy: 'deny',
      nextBatch: null,
    };
  }
}
