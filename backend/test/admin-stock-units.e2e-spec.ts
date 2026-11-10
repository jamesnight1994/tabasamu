import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  adminHeaders,
  closeE2e,
  createE2eApp,
  getE2ePrisma,
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

  async function printOneCode(): Promise<string> {
    const printed = await request(app.getHttpServer())
      .post('/v1/admin/stock-units/batches')
      .set(adminHeaders)
      .send({ size: 1 })
      .expect(201);
    return printed.body.units[0].code as string;
  }

  async function stockOnHand(): Promise<number> {
    const variant = await getE2ePrisma().variant.findUniqueOrThrow({
      where: { id: variantId },
    });
    return variant.stockOnHand;
  }

  it('rejects print / activate / fulfill / void without API key', async () => {
    await request(app.getHttpServer()).post('/v1/admin/stock-units/batches').send({ size: 1 }).expect(401);
    await request(app.getHttpServer()).post('/v1/admin/stock-units/nope/activate').send({ variantId }).expect(401);
    await request(app.getHttpServer()).post('/v1/admin/stock-units/nope/fulfill').expect(401);
    await request(app.getHttpServer()).post('/v1/admin/stock-units/nope/void').expect(401);
    await request(app.getHttpServer())
      .patch('/v1/admin/stock-units/nope')
      .send({ status: 'void' })
      .expect(401);
  });

  it('prints blank codes, activates, then fulfills and syncs stockOnHand', async () => {
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
    expect(await stockOnHand()).toBe(0);

    const activated = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/activate`)
      .set(adminHeaders)
      .send({ variantId })
      .expect(201);

    expect(activated.body.status).toBe('in_stock');
    expect(activated.body.variantId).toBe(variantId);
    expect(await stockOnHand()).toBe(1);

    const sold = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/fulfill`)
      .set(adminHeaders)
      .expect(201);

    expect(sold.body.status).toBe('sold');
    expect(await stockOnHand()).toBe(0);
  });

  it('voids printed without changing stockOnHand', async () => {
    const before = await stockOnHand();
    const code = await printOneCode();

    const voided = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/void`)
      .set(adminHeaders)
      .expect(201);

    expect(voided.body.status).toBe('void');
    expect(await stockOnHand()).toBe(before);
  });

  it('voids in_stock and recounts stockOnHand to zero', async () => {
    const code = await printOneCode();
    await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/activate`)
      .set(adminHeaders)
      .send({ variantId })
      .expect(201);
    expect(await stockOnHand()).toBe(1);

    const voided = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/void`)
      .set(adminHeaders)
      .expect(201);

    expect(voided.body.status).toBe('void');
    expect(await stockOnHand()).toBe(0);
  });

  it('PATCH can void a printed unit', async () => {
    const code = await printOneCode();
    const patched = await request(app.getHttpServer())
      .patch(`/v1/admin/stock-units/${code}`)
      .set(adminHeaders)
      .send({ status: 'void' })
      .expect(200);

    expect(patched.body.status).toBe('void');
  });

  it('rejects sold reactivation and sold→void', async () => {
    const code = await printOneCode();
    await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/activate`)
      .set(adminHeaders)
      .send({ variantId })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/fulfill`)
      .set(adminHeaders)
      .expect(201);

    const reactivate = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/activate`)
      .set(adminHeaders)
      .send({ variantId })
      .expect(409);
    expect(reactivate.body.message).toMatch(/sold/i);

    const voidSold = await request(app.getHttpServer())
      .post(`/v1/admin/stock-units/${code}/void`)
      .set(adminHeaders)
      .expect(409);
    expect(voidSold.body.message).toMatch(/sold|new code/i);

    const patchSold = await request(app.getHttpServer())
      .patch(`/v1/admin/stock-units/${code}`)
      .set(adminHeaders)
      .send({ status: 'in_stock', variantId })
      .expect(409);
    expect(patchSold.body.message).toMatch(/sold/i);
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
