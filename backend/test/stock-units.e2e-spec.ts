/**
 * Serialized stock units (#20) — admin read surface + stock-sync rule.
 *
 * Run (Postgres on :5437 from docker-compose.dev.yml):
 *   # once: CREATE DATABASE tabasamu_test;
 *   yarn test:e2e -- test/stock-units.e2e-spec.ts
 */
import { INestApplication } from '@nestjs/common';
import { StockUnitStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { StockUnitsService } from '../src/stock-units/stock-units.service';
import {
  adminHeaders,
  closeE2e,
  createE2eApp,
  getE2ePrisma,
  prepareE2eDatabase,
  truncateCatalogue,
} from './e2e-setup';

describe('Admin stock units (e2e) — serialized inventory foundation', () => {
  let app: INestApplication<App>;
  const variantId = 'var_e2e_stockunit_1l';
  const otherVariantId = 'var_e2e_stockunit_other_1l';

  beforeAll(async () => {
    prepareE2eDatabase();
    await truncateCatalogue();

    const db = getE2ePrisma();
    await db.product.create({
      data: {
        id: 'prod_e2e_stockunit',
        slug: 'e2e-stockunit',
        name: 'E2E StockUnit',
        flavour: 'E2E StockUnit',
        variants: {
          create: [
            { id: variantId, sku: 'TS-E2E-SU-1L', stockOnHand: 999 },
            { id: otherVariantId, sku: 'TS-E2E-SU-OTHER-1L', stockOnHand: 0 },
          ],
        },
      },
    });

    // 3 in_stock + 1 printed + 1 sold + 1 void on `variantId`; 1 printed blank (no variant).
    await db.stockUnit.createMany({
      data: [
        {
          code: 'su-instock-1',
          status: StockUnitStatus.in_stock,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-instock-2',
          status: StockUnitStatus.in_stock,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-instock-3',
          status: StockUnitStatus.in_stock,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-printed-1',
          status: StockUnitStatus.printed,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-sold-1',
          status: StockUnitStatus.sold,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-void-1',
          status: StockUnitStatus.void,
          variantId,
          batchId: 'batch-1',
        },
        {
          code: 'su-blank-1',
          status: StockUnitStatus.printed,
          batchId: 'batch-2',
        },
      ],
    });

    app = await createE2eApp();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await closeE2e();
  });

  it('GET /v1/admin/stock-units without API key → 401', async () => {
    await request(app.getHttpServer()).get('/v1/admin/stock-units').expect(401);
  });

  it('GET /v1/admin/stock-units lists all units (admin key)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/stock-units')
      .set(adminHeaders)
      .expect(200);

    expect(res.body.items).toEqual(expect.any(Array));
    expect(res.body.items).toHaveLength(7);
    // Opaque code is the handle; internal id is never exposed.
    expect(res.body.items[0]).toHaveProperty('code');
    expect(res.body.items[0]).not.toHaveProperty('id');
  });

  it('GET /v1/admin/stock-units?status=in_stock filters by status', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/stock-units?status=in_stock')
      .set(adminHeaders)
      .expect(200);

    expect(res.body.items).toHaveLength(3);
    expect(
      res.body.items.every((u: { status: string }) => u.status === 'in_stock'),
    ).toBe(true);
  });

  it('GET /v1/admin/stock-units?variantId=&batchId= filters by variant and batch', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/admin/stock-units?variantId=${variantId}&batchId=batch-1`)
      .set(adminHeaders)
      .expect(200);

    expect(res.body.items).toHaveLength(6);
  });

  it('GET /v1/admin/stock-units/summary returns counts by status for a variant', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/admin/stock-units/summary?variantId=${variantId}`)
      .set(adminHeaders)
      .expect(200);

    expect(res.body).toEqual({
      variantId,
      counts: { printed: 1, in_stock: 3, sold: 1, void: 1 },
      total: 6,
    });
  });

  it('GET /v1/admin/stock-units/:code returns one unit by its opaque code', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/stock-units/su-instock-1')
      .set(adminHeaders)
      .expect(200);

    expect(res.body.code).toBe('su-instock-1');
    expect(res.body.status).toBe('in_stock');
    expect(res.body.variantId).toBe(variantId);
  });

  it('GET /v1/admin/stock-units/:code → 404 for unknown code', async () => {
    await request(app.getHttpServer())
      .get('/v1/admin/stock-units/does-not-exist')
      .set(adminHeaders)
      .expect(404);
  });

  it('syncVariantStock reconciles stockOnHand to the count of in_stock units', async () => {
    const service = app.get(StockUnitsService);
    const db = getE2ePrisma();

    // Seeded stockOnHand (999) is stale vs the ledger (3 in_stock).
    const onHand = await service.syncVariantStock(variantId);
    expect(onHand).toBe(3);

    const variant = await db.variant.findUnique({ where: { id: variantId } });
    expect(variant?.stockOnHand).toBe(3);

    // A variant with no in_stock units reconciles to 0.
    const otherOnHand = await service.syncVariantStock(otherVariantId);
    expect(otherOnHand).toBe(0);
    const other = await db.variant.findUnique({
      where: { id: otherVariantId },
    });
    expect(other?.stockOnHand).toBe(0);
  });
});
