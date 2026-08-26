import type { AdminProductsGridColumn } from './products-types';

export const ADMIN_PRODUCTS_GRID_COLUMNS: AdminProductsGridColumn[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'status', label: 'Status', type: 'status' },
  { id: 'flavour', label: 'Flavour', type: 'text' },
  { id: 'primarySku', label: 'SKU', type: 'text' },
  { id: 'stockOnHand', label: 'Stock', type: 'number' },
  { id: 'subscriptionEligible', label: 'Subscribe', type: 'boolean' },
  { id: 'descriptorLabel', label: 'Descriptor', type: 'pending' },
  { id: 'actions', label: '', type: 'actions' },
];
