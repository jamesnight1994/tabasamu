import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  adminHeaders,
  closeE2e,
  createE2eApp,
  prepareE2eDatabase,
  truncateCatalogue,
} from './e2e-setup';

describe('Admin stock units (e2e)', () => {
  let app: INestApplication<App>;
  let variantId: string;

  beforeAll(async () => {
    prepareE2eDatabase();
    await truncateCatalogue();
    app = await createE2eApp();

    const created = await request(app.getHttpServer())
      .post('/v1/admin/products')
      .set(adminHeaders)
      .send({
        slug: 'e2e-stock-grape',
        name: 'Grape Ginger',
        flavour: 'Grape Ginger',
        variants: [{ sku: 'TS-E2E-STOCK-1L', stockOnHand: 0 }],
      })
      .expect(201);
    variantId = created.body.variants[0].id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await closeE2e();
  });

  it('rejects print / activate / fulfill without API key', async () => {
    await request(app.getHttpServer()).post('/v1/admin/stock-units/batches').send({ size: 1 }).expect(401);
    await request(app.getHttpServer()).post('/v1/admin/stock-units/nope/activate').send({ variantId }).expect(401);
    await request(app.getHttpServer()).post('/v1/admin/stock-units/nope/fulfill').expect(401);
  });

  it('prints blank codes, activates, then fulfills', async () => {
    const printed = await request(app.getHttpServer())
      .post('/v1/admin/stock-units/batches')
      .set(adminHeaders)
      .send({ size: 2 })
      .expect(201);

    expect(printed.body.source).toBe('nest');
    expect(printed.body.units).toHaveLength(2);
    expect(printed.body.units[0].status).toBe('printed');
    expect(printed.body.units[0].variantId).toBeNull();

    const code = printed.body.units[0].code as string;

    const activated = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/activate`)
      .set(adminHeaders)
      .send({ variantId })
      .expect(201);

    expect(activated.body.status).toBe('in_stock');
    expect(activated.body.variantId).toBe(variantId);

    const sold = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/fulfill`)
      .set(adminHeaders)
      .expect(201);

    expect(sold.body.status).toBe('sold');
  });

  it('returns a clear 404 for an unknown code', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/admin/stock-units/unknown-code/activate')
      .set(adminHeaders)
      .send({ variantId })
      .expect(404);
    expect(res.body.message).toMatch(/not in the system/);
  });
});
