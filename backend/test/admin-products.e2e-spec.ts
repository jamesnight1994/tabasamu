/**
 * Admin products API — executable contract for frontend integration.
 *
 * Auth today: header `X-Admin-Api-Key` (see ADMIN_API_KEY). No User table yet.
 * Response bodies are snapshotted under `__snapshots__/` (stable ids replaced).
 *
 * Run (Postgres on :5437 from docker-compose.dev.yml):
 *   # once: CREATE DATABASE tabasamu_test;
 *   yarn test:e2e -- test/admin-products.e2e-spec.ts
 * Update snapshots: yarn test:e2e -- test/admin-products.e2e-spec.ts -u
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  adminHeaders,
  closeE2e,
  createE2eApp,
  E2E_ADMIN_API_KEY,
  prepareE2eDatabase,
  truncateCatalogue,
} from './e2e-setup';

/** Replace run-specific ids so snapshots stay stable for frontend contract review. */
function stabilize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stabilize);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (
        (key === 'id' || key === 'productId') &&
        typeof v === 'string'
      ) {
        out[key] = '<id>';
      } else {
        out[key] = stabilize(v);
      }
    }
    return out;
  }
  return value;
}

describe('Admin products (e2e) — frontend integration contract', () => {
  let app: INestApplication<App>;
  const slug = 'e2e-flavour-snapshot';
  let productId: string;

  beforeAll(async () => {
    prepareE2eDatabase();
    await truncateCatalogue();
    app = await createE2eApp();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await closeE2e();
  });

  it('GET /v1/admin/products without API key → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/products')
      .expect(401);
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('GET /v1/admin/products with wrong API key → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/products')
      .set('X-Admin-Api-Key', 'wrong-key')
      .expect(401);
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('POST /v1/admin/products with admin key creates a draft product', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/admin/products')
      .set(adminHeaders)
      .send({
        slug,
        name: 'E2E Flavour',
        flavour: 'E2E Flavour',
        descriptor: 'Caffeine Free',
        base: 'Rooibos',
        variants: [
          {
            sku: 'TS-E2E-SNAPSHOT-1L',
            sizeCode: '1L',
            millilitres: 1000,
            stockOnHand: 5,
            priceAmount: 55000,
          },
        ],
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeDefined();
    productId = res.body.id;
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('GET /v1/admin/products with admin key lists created product', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/admin/products')
      .set(adminHeaders)
      .expect(200);

    expect(res.body.items).toEqual(expect.any(Array));
    const found = res.body.items.find((p: { slug: string }) => p.slug === slug);
    expect(found).toBeDefined();
    expect(found.id).toBe(productId);
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('PUT /v1/admin/products/:id updates product fields', async () => {
    const res = await request(app.getHttpServer())
      .put(`/v1/admin/products/${productId}`)
      .set(adminHeaders)
      .send({ name: 'E2E Flavour Updated', position: 99 })
      .expect(200);

    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('POST /v1/admin/products/:id/publish without descriptor/base → 422', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/admin/products')
      .set(adminHeaders)
      .send({
        slug: 'e2e-bare-snapshot',
        name: 'Bare',
        variants: [{ sku: 'TS-BARE-SNAPSHOT-1L' }],
      });

    expect([200, 201]).toContain(created.status);
    const bareId = created.body.id as string;

    const res = await request(app.getHttpServer())
      .post(`/v1/admin/products/${bareId}/publish`)
      .set(adminHeaders)
      .expect(422);
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('POST /v1/admin/products/:id/publish with descriptor/base → active', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/admin/products/${productId}/publish`)
      .set(adminHeaders);

    expect([200, 201]).toContain(res.status);
    expect(stabilize(res.body)).toMatchSnapshot();
  });

  it('documents admin key used by this suite (for frontend .env)', () => {
    expect(E2E_ADMIN_API_KEY.length).toBeGreaterThan(0);
  });
});
