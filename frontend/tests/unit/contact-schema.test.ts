import { describe, it, expect } from 'vitest';
import {
  contactFormDefaults,
  contactFormSchema,
} from '../../src/domain/contact/contact-schema';

describe('contactFormSchema', () => {
  const valid = {
    ...contactFormDefaults,
    name: 'Wanjiku Kamau',
    email: 'wanjiku@example.com',
    phone: '0712345678',
    message: 'I have a question about delivery to Westlands.',
  };

  it('accepts a valid payload', () => {
    const result = contactFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts an empty optional phone', () => {
    const result = contactFormSchema.safeParse({ ...valid, phone: '' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty optional enquiry type', () => {
    const result = contactFormSchema.safeParse({ ...valid, enquiryType: undefined });
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = contactFormSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = contactFormSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a short message', () => {
    const result = contactFormSchema.safeParse({ ...valid, message: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('rejects a phone that is too short when provided', () => {
    const result = contactFormSchema.safeParse({ ...valid, phone: '123' });
    expect(result.success).toBe(false);
  });
});
