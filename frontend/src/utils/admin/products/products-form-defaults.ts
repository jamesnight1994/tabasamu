import type { NestApiProduct } from '../../../adapters/http/map-nest-product';
import type { AdminProductFormValues } from './products-types';
import { productToFormValues } from './products-form-mappers';

export function buildEmptyProductFormDefaults(nextPosition: number): AdminProductFormValues {
  return {
    name: '',
    slug: '',
    flavour: 'grape-ginger',
    position: nextPosition,
    subscriptionEligible: true,
    descriptor: '',
    base: '',
    forwardNote: '',
    primarySku: '',
    stockOnHand: 0,
  };
}

export function computeNextProductPosition(products: NestApiProduct[]): number {
  if (!products.length) return 1;
  return Math.max(...products.map((product) => product.position ?? 0)) + 1;
}

export { productToFormValues };
