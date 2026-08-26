import { describe, expect, it } from 'vitest';
import {
  extractApiErrorMessage,
  isProductSlugConflictError,
} from '../../src/lib/admin/extract-api-error';

describe('isProductSlugConflictError', () => {
  it('detects Nest slug conflict responses', () => {
    const error = {
      response: {
        status: 409,
        data: { message: 'Slug already exists: grape-ginger', statusCode: 409 },
      },
    };

    expect(isProductSlugConflictError(error)).toBe(true);
    expect(extractApiErrorMessage(error)).toBe('Slug already exists: grape-ginger');
  });

  it('ignores non-slug 409 responses', () => {
    const error = {
      response: {
        status: 409,
        data: { message: 'Resource locked', statusCode: 409 },
      },
    };

    expect(isProductSlugConflictError(error)).toBe(false);
  });
});
