import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetClientEnv } from '../../src/lib/config/env';
import {
  isAdminDevBypassEnabled,
  useAdminNestBff,
  getDevBypassApiKey,
} from '../../src/lib/admin/dev-auth-bypass';
import { isNonProductionAppEnv } from '../../src/lib/config/runtime-env';

describe('admin staging bypass + BFF gate', () => {
  const prev = { ...process.env };

  beforeEach(() => {
    resetClientEnv();
    delete process.env.TABASAMU_APP_ENV;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    delete process.env.NEXT_PUBLIC_ADMIN_AUTH_BYPASS;
    delete process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  });

  afterEach(() => {
    process.env = { ...prev };
    resetClientEnv();
  });

  it('isNonProductionAppEnv allows development and staging only', () => {
    expect(isNonProductionAppEnv('development')).toBe(true);
    expect(isNonProductionAppEnv('staging')).toBe(true);
    expect(isNonProductionAppEnv('production')).toBe(false);
    expect(isNonProductionAppEnv(undefined)).toBe(false);
  });

  it('enables bypass + BFF when APP_ENV=staging', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    expect(isAdminDevBypassEnabled()).toBe(true);
    expect(useAdminNestBff()).toBe(true);
    expect(getDevBypassApiKey()).toBeNull();
  });

  it('enables bypass when APP_ENV=development', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'development';
    expect(isAdminDevBypassEnabled()).toBe(true);
  });

  it('disables bypass when APP_ENV=production', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    expect(isAdminDevBypassEnabled()).toBe(false);
    expect(useAdminNestBff()).toBe(false);
  });

  it('prefers TABASAMU_APP_ENV over NEXT_PUBLIC_APP_ENV on server', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
    process.env.TABASAMU_APP_ENV = 'staging';
    expect(isAdminDevBypassEnabled()).toBe(true);
  });
});
