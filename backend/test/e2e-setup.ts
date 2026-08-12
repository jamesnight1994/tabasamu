/**
 * Shared e2e harness — Postgres + Nest app bootstrap.
 * Frontend developers: treat admin-products.e2e-spec.ts as executable API docs.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

config({ path: resolve(__dirname, '.env.e2e') });
config({ path: resolve(__dirname, '../.env') });

/** Admin identity for e2e (API key — Nest has no User table yet). */
export const E2E_ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim() || 'e2e-admin-key';

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  'postgresql://tabasamu:tabasamu@localhost:5435/tabasamu_test?schema=public';

let prisma: PrismaClient | null = null;

export function getE2ePrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({ datasources: { db: { url: E2E_DATABASE_URL } } });
  }
  return prisma;
}

/** Migrate test DB and set env before Nest boots (PrismaService reads DATABASE_URL). */
export function prepareE2eDatabase(): void {
  process.env.DATABASE_URL = E2E_DATABASE_URL;
  process.env.ADMIN_API_KEY = E2E_ADMIN_API_KEY;
  process.env.PORT = process.env.PORT || '3001';

  execSync('yarn prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
  });
}

export async function truncateCatalogue(): Promise<void> {
  const db = getE2ePrisma();
  // FK order: images/variants → products
  await db.productImage.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
}

export async function createE2eApp(): Promise<INestApplication<App>> {
  process.env.DATABASE_URL = E2E_DATABASE_URL;
  process.env.ADMIN_API_KEY = E2E_ADMIN_API_KEY;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

export async function closeE2e(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export const adminHeaders = {
  'X-Admin-Api-Key': E2E_ADMIN_API_KEY,
};
