import { describe, expect, it } from 'vitest';
import {
  resolveAdminReturnUrl,
  shouldRewriteAdminEntryPath,
} from '../../src/lib/admin/admin-return-url';

describe('resolveAdminReturnUrl', () => {
  it('maps /admin to /dashboard', () => {
    expect(resolveAdminReturnUrl('/admin')).toBe('/dashboard');
  });

  it('maps /admin/dashboard paths to /dashboard paths', () => {
    expect(resolveAdminReturnUrl('/admin/dashboard')).toBe('/dashboard');
    expect(resolveAdminReturnUrl('/admin/dashboard/products')).toBe('/dashboard/products');
  });

  it('keeps valid dashboard paths', () => {
    expect(resolveAdminReturnUrl('/dashboard/products')).toBe('/dashboard/products');
  });

  it('falls back for auth-only admin paths', () => {
    expect(resolveAdminReturnUrl('/admin/login')).toBe('/dashboard');
  });
});

describe('shouldRewriteAdminEntryPath', () => {
  it('detects legacy admin entry URLs', () => {
    expect(shouldRewriteAdminEntryPath('/admin')).toBe(true);
    expect(shouldRewriteAdminEntryPath('/admin/dashboard/products')).toBe(true);
    expect(shouldRewriteAdminEntryPath('/admin/login')).toBe(false);
    expect(shouldRewriteAdminEntryPath('/dashboard')).toBe(false);
  });
});
