import type { NestApiProduct, NestPending } from '../../../adapters/http/map-nest-product';
import type { AdminProductFormValues } from './products-types';

export function pendingToInput(field?: NestPending<string>): string {
  if (!field) return '';
  return field.available ? (field.value ?? '') : '';
}

export function inputToNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function buildCreateProductPayload(values: AdminProductFormValues) {
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    flavour: values.flavour,
    position: values.position,
    subscriptionEligible: values.subscriptionEligible,
    status: 'draft' as const,
    descriptor: inputToNullableString(values.descriptor),
    base: inputToNullableString(values.base),
    forwardNote: inputToNullableString(values.forwardNote),
    variants: [
      {
        sku: values.primarySku.trim(),
        stockOnHand: values.stockOnHand,
        active: true,
        sizeCode: '1l',
        millilitres: 1000,
      },
    ],
  };
}

export function buildUpdateProductPayload(values: AdminProductFormValues) {
  return {
    name: values.name.trim(),
    flavour: values.flavour,
    position: values.position,
    subscriptionEligible: values.subscriptionEligible,
    descriptor: inputToNullableString(values.descriptor),
    base: inputToNullableString(values.base),
    forwardNote: inputToNullableString(values.forwardNote),
  };
}

export function productToFormValues(product: NestApiProduct): AdminProductFormValues {
  const primary = product.variants?.find((variant) => variant.active) ?? product.variants?.[0];

  return {
    name: product.name,
    slug: product.slug,
    flavour: product.flavour,
    position: product.position,
    subscriptionEligible: product.subscriptionEligible,
    descriptor: pendingToInput(product.descriptor),
    base: pendingToInput(product.base),
    forwardNote: pendingToInput(product.forwardNote),
    primarySku: primary?.sku ?? '',
    stockOnHand: primary?.stockOnHand ?? 0,
  };
}
