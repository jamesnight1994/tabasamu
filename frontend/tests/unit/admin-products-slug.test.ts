import { describe, expect, it } from 'vitest';
import { suggestProductSlugFromName } from '../../src/utils/admin/products/products-slug';

describe('suggestProductSlugFromName', () => {
  it('converts product names to kebab-case slugs', () => {
    expect(suggestProductSlugFromName('Grape & Ginger')).toBe('grape-and-ginger');
    expect(suggestProductSlugFromName('  Pineapple Ginger  ')).toBe('pineapple-ginger');
  });

  it('strips invalid characters and collapses hyphens', () => {
    expect(suggestProductSlugFromName('Hello---World!!!')).toBe('hello-world');
    expect(suggestProductSlugFromName('')).toBe('');
  });
});
