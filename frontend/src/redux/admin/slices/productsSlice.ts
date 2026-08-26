import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { NestApiProduct } from '../../../adapters/http/map-nest-product';
import { showAdminError, showAdminSuccess } from '../../../lib/admin/admin-toast';
import { extractApiErrorMessage, isProductSlugConflictError } from '../../../lib/admin/extract-api-error';
import { adminProductsService } from '../../../services/admin/admin-products-service';
import { getProductSheetConfig } from '../../../utils/admin/products/products-form-config';
import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
} from '../../../utils/admin/products/products-form-mappers';
import { toAdminProductRow } from '../../../utils/admin/products/products-display';
import { filterAdminProducts } from '../../../utils/admin/products/products-search';
import type {
  AdminProductFormValues,
  AdminProductRow,
  AdminProductsStatusFilter,
  ProductSheetContext,
  ProductSheetState,
} from '../../../utils/admin/products/products-types';
import type { AdminAppDispatch, AdminRootState } from '../store';

type AdminProductsThunkConfig = {
  state: AdminRootState;
  dispatch: AdminAppDispatch;
  rejectValue: string;
};

type CreateAdminProductReject = {
  message: string;
  slugConflict?: boolean;
};

type CreateAdminProductThunkConfig = {
  state: AdminRootState;
  dispatch: AdminAppDispatch;
  rejectValue: CreateAdminProductReject;
};

type FetchAdminProductsResult = {
  rows: AdminProductRow[];
  items: NestApiProduct[];
};

type ProductsState = {
  rows: AdminProductRow[];
  items: NestApiProduct[];
  listLoader: boolean;
  actionLoader: boolean;
  createLoader: boolean;
  updateLoader: boolean;
  productSheet: ProductSheetState;
  searchQuery: string;
  page: number;
  rowsPerPage: number;
  error: string | null;
  statusFilter: AdminProductsStatusFilter;
};

const initialProductSheet: ProductSheetState = {
  visible: false,
  context: null,
  productId: null,
};

const initialState: ProductsState = {
  rows: [],
  items: [],
  listLoader: false,
  actionLoader: false,
  createLoader: false,
  updateLoader: false,
  productSheet: initialProductSheet,
  searchQuery: '',
  page: 1,
  rowsPerPage: 25,
  error: null,
  statusFilter: 'all',
};

export const fetchAdminProducts = createAsyncThunk<
  FetchAdminProductsResult,
  void,
  AdminProductsThunkConfig
>('adminProducts/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const { statusFilter } = getState().adminProducts;
    const status = statusFilter === 'all' ? undefined : statusFilter;
    const items = await adminProductsService.list(status);
    return {
      items,
      rows: items.map(toAdminProductRow),
    };
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error, 'Failed to load products'));
  }
});

export const publishAdminProduct = createAsyncThunk<string, string, AdminProductsThunkConfig>(
  'adminProducts/publish',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.publish(id);
      showAdminSuccess('Product published', 'The product is now active in the catalogue.');
      await dispatch(fetchAdminProducts());
      return id;
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to publish product');
      showAdminError('Could not publish product', message);
      return rejectWithValue(message);
    }
  },
);

export const archiveAdminProduct = createAsyncThunk<string, string, AdminProductsThunkConfig>(
  'adminProducts/archive',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.archive(id);
      showAdminSuccess('Product deactivated', 'The product was archived.');
      await dispatch(fetchAdminProducts());
      return id;
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to deactivate product');
      showAdminError('Could not deactivate product', message);
      return rejectWithValue(message);
    }
  },
);

export const createAdminProduct = createAsyncThunk<
  boolean,
  AdminProductFormValues,
  CreateAdminProductThunkConfig
>('adminProducts/create', async (formValues, { dispatch, rejectWithValue }) => {
  try {
    const payload = buildCreateProductPayload(formValues);
    await adminProductsService.create(payload);
    showAdminSuccess('Product created', 'The product was saved as a draft.');
    dispatch(closeProductSheet());
    await dispatch(fetchAdminProducts());
    return true;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create product');
    const slugConflict = isProductSlugConflictError(error);
    showAdminError('Could not create product', message);
    return rejectWithValue({ message, slugConflict });
  }
});

export const updateAdminProduct = createAsyncThunk<
  boolean,
  { id: string; formValues: AdminProductFormValues },
  AdminProductsThunkConfig
>('adminProducts/update', async ({ id, formValues }, { dispatch, rejectWithValue }) => {
  try {
    const payload = buildUpdateProductPayload(formValues);
    await adminProductsService.update(id, payload);
    showAdminSuccess('Product updated', 'Changes were saved successfully.');
    dispatch(closeProductSheet());
    await dispatch(fetchAdminProducts());
    return true;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update product');
    showAdminError('Could not update product', message);
    return rejectWithValue(message);
  }
});

const productsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    openProductSheet(
      state,
      action: PayloadAction<{ context: ProductSheetContext; productId?: string }>,
    ) {
      state.productSheet = {
        visible: true,
        context: action.payload.context,
        productId: action.payload.productId ?? null,
      };
    },
    closeProductSheet(state) {
      state.productSheet = initialProductSheet;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action: PayloadAction<AdminProductsStatusFilter>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    clearProductsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.listLoader = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.listLoader = false;
        state.rows = action.payload.rows;
        state.items = action.payload.items;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.listLoader = false;
        state.error = String(action.payload ?? action.error.message ?? 'Failed to load products');
      })
      .addCase(publishAdminProduct.pending, (state) => {
        state.actionLoader = true;
        state.error = null;
      })
      .addCase(publishAdminProduct.fulfilled, (state) => {
        state.actionLoader = false;
      })
      .addCase(publishAdminProduct.rejected, (state, action) => {
        state.actionLoader = false;
        state.error = String(action.payload ?? action.error.message ?? 'Failed to publish product');
      })
      .addCase(archiveAdminProduct.pending, (state) => {
        state.actionLoader = true;
        state.error = null;
      })
      .addCase(archiveAdminProduct.fulfilled, (state) => {
        state.actionLoader = false;
      })
      .addCase(archiveAdminProduct.rejected, (state, action) => {
        state.actionLoader = false;
        state.error = String(
          action.payload ?? action.error.message ?? 'Failed to deactivate product',
        );
      })
      .addCase(createAdminProduct.pending, (state) => {
        state.createLoader = true;
        state.error = null;
      })
      .addCase(createAdminProduct.fulfilled, (state) => {
        state.createLoader = false;
      })
      .addCase(createAdminProduct.rejected, (state, action) => {
        state.createLoader = false;
        const payload = action.payload;
        state.error =
          payload?.message ??
          String(action.error.message ?? 'Failed to create product');
      })
      .addCase(updateAdminProduct.pending, (state) => {
        state.updateLoader = true;
        state.error = null;
      })
      .addCase(updateAdminProduct.fulfilled, (state) => {
        state.updateLoader = false;
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.updateLoader = false;
        state.error = String(action.payload ?? action.error.message ?? 'Failed to update product');
      });
  },
});

export const {
  openProductSheet,
  closeProductSheet,
  setSearchQuery,
  setPage,
  setRowsPerPage,
  setStatusFilter,
  clearProductsError,
} = productsSlice.actions;

export default productsSlice.reducer;

export const selectAdminProductRows = (state: AdminRootState) => state.adminProducts.rows;

export const selectAdminProductItems = (state: AdminRootState) => state.adminProducts.items;

export const selectProductSheet = (state: AdminRootState) => state.adminProducts.productSheet;

export const selectProductSheetSubmitLoader = (state: AdminRootState) =>
  state.adminProducts.createLoader || state.adminProducts.updateLoader;

export const selectProductSheetProduct = createSelector(
  [selectAdminProductItems, selectProductSheet],
  (items, sheet) =>
    sheet.productId ? adminProductsService.findCachedById(items, sheet.productId) ?? null : null,
);

export const selectProductSheetConfig = createSelector([selectProductSheet], (sheet) =>
  getProductSheetConfig(sheet.context),
);

export const selectFilteredProductRows = createSelector(
  [selectAdminProductRows, (state: AdminRootState) => state.adminProducts.searchQuery],
  (rows, searchQuery) => filterAdminProducts(rows, searchQuery),
);

export const selectPaginatedProductRows = createSelector(
  [
    selectFilteredProductRows,
    (state: AdminRootState) => state.adminProducts.page,
    (state: AdminRootState) => state.adminProducts.rowsPerPage,
  ],
  (rows, page, rowsPerPage) => {
    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  },
);

export const selectProductsPaginationMeta = createSelector(
  [
    selectFilteredProductRows,
    (state: AdminRootState) => state.adminProducts.page,
    (state: AdminRootState) => state.adminProducts.rowsPerPage,
  ],
  (rows, page, rowsPerPage) => ({
    total: rows.length,
    page,
    rowsPerPage,
    totalPages: Math.max(1, Math.ceil(rows.length / rowsPerPage)),
  }),
);
