export type AdminProductStatus = 'draft' | 'active' | 'archived';

/** Flattened row for table display and client-side search. */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  flavour: string;
  status: AdminProductStatus;
  position: number;
  subscriptionEligible: boolean;
  primarySku: string | null;
  stockOnHand: number;
  descriptorLabel: string;
  canPublish: boolean;
  canArchive: boolean;
};

export type AdminProductsGridColumn = {
  id: keyof AdminProductRow | 'actions';
  label: string;
  type?: 'text' | 'status' | 'boolean' | 'pending' | 'number' | 'actions';
  className?: string;
};

export type AdminProductsStatusFilter = 'all' | AdminProductStatus;

export type ProductSheetContext = 'addProduct' | 'updateProduct';

export type ProductSheetState = {
  visible: boolean;
  context: ProductSheetContext | null;
  productId: string | null;
};

export type AdminProductFormValues = {
  name: string;
  slug: string;
  flavour: string;
  position: number;
  subscriptionEligible: boolean;
  descriptor: string;
  base: string;
  forwardNote: string;
  primarySku: string;
  stockOnHand: number;
};
