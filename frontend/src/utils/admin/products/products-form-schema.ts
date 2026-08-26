import * as Yup from 'yup';

export const adminProductCreateSchema = Yup.object({
  name: Yup.string().trim().required('Product name is required'),
  slug: Yup.string()
    .trim()
    .required('Slug is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
  flavour: Yup.string().required('Flavour is required'),
  position: Yup.number().integer().min(0).required('Position is required'),
  subscriptionEligible: Yup.boolean().required(),
  primarySku: Yup.string().trim().required('SKU is required'),
  stockOnHand: Yup.number().integer().min(0).required('Stock is required'),
  descriptor: Yup.string().default(''),
  base: Yup.string().default(''),
  forwardNote: Yup.string().default(''),
});

export const adminProductUpdateSchema = adminProductCreateSchema.omit([
  'slug',
  'primarySku',
  'stockOnHand',
]);
