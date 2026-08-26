import { FLAVOUR_SLUGS } from '../../../domain/catalogue';
import {
  adminProductCreateSchema,
  adminProductUpdateSchema,
} from './products-form-schema';
import type { AdminProductFormValues, ProductSheetContext } from './products-types';

export type ProductFormFieldType = 'text' | 'number' | 'boolean' | 'select';

export type ProductFormFieldConfig = {
  key: keyof AdminProductFormValues;
  label: string;
  type: ProductFormFieldType;
  required?: boolean;
  placeholder?: string;
  modes?: ProductSheetContext[];
  readOnlyOnUpdate?: boolean;
  options?: Array<{ label: string; value: string }>;
};

export type ProductFormSectionConfig = {
  id: string;
  title: string;
  description?: string;
  fields: ProductFormFieldConfig[];
};

export type ProductSheetConfig = {
  context: ProductSheetContext;
  title: string;
  submitLabel: string;
  isUpdate: boolean;
  schema: typeof adminProductCreateSchema | typeof adminProductUpdateSchema;
};

const flavourOptions = FLAVOUR_SLUGS.map((slug) => ({
  value: slug,
  label: slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
}));

export const PRODUCT_FORM_SECTIONS: ProductFormSectionConfig[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Identity and catalogue ordering.',
    fields: [
      {
        key: 'name',
        label: 'Product name',
        type: 'text',
        required: true,
        placeholder: 'Grape & Ginger',
      },
      {
        key: 'slug',
        label: 'Slug',
        type: 'text',
        required: true,
        placeholder: 'grape-ginger',
        readOnlyOnUpdate: true,
      },
      {
        key: 'flavour',
        label: 'Flavour',
        type: 'select',
        required: true,
        options: flavourOptions,
      },
      {
        key: 'position',
        label: 'Position',
        type: 'number',
        required: true,
      },
      {
        key: 'subscriptionEligible',
        label: 'Subscription eligible',
        type: 'boolean',
      },
    ],
  },
  {
    id: 'copy',
    title: 'Copy',
    description: 'Descriptor and tasting notes shown on the storefront when approved.',
    fields: [
      {
        key: 'descriptor',
        label: 'Descriptor',
        type: 'text',
        placeholder: 'Short product descriptor',
      },
      {
        key: 'base',
        label: 'Base',
        type: 'text',
        placeholder: 'e.g. Sparkling water base',
      },
      {
        key: 'forwardNote',
        label: 'Forward note',
        type: 'text',
        placeholder: 'Optional forward note',
      },
    ],
  },
  {
    id: 'variant',
    title: 'Primary variant',
    description: 'Initial SKU and stock. Additional variants come in a later editor.',
    fields: [
      {
        key: 'primarySku',
        label: 'SKU',
        type: 'text',
        required: true,
        modes: ['addProduct'],
      },
      {
        key: 'stockOnHand',
        label: 'Stock on hand',
        type: 'number',
        modes: ['addProduct'],
      },
    ],
  },
];

export const PRODUCT_SHEET_CONFIGS: Record<ProductSheetContext, ProductSheetConfig> = {
  addProduct: {
    context: 'addProduct',
    title: 'Add product',
    submitLabel: 'Save',
    isUpdate: false,
    schema: adminProductCreateSchema,
  },
  updateProduct: {
    context: 'updateProduct',
    title: 'Update product',
    submitLabel: 'Update',
    isUpdate: true,
    schema: adminProductUpdateSchema,
  },
};

export function getProductSheetConfig(context: ProductSheetContext | null): ProductSheetConfig | null {
  if (!context) return null;
  return PRODUCT_SHEET_CONFIGS[context] ?? null;
}
