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
