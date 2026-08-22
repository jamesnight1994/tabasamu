import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '../../../lib/admin/extract-api-error';
import { adminProductsService } from '../../../services/admin/admin-products-service';
import { toAdminProductRow } from '../../../utils/admin/products/products-display';
import { filterAdminProducts } from '../../../utils/admin/products/products-search';
import type {
  AdminProductRow,
  AdminProductsStatusFilter,
} from '../../../utils/admin/products/products-types';
import type { AdminRootState } from '../store';

type ProductsState = {
  rows: AdminProductRow[];
  listLoader: boolean;
  actionLoader: boolean;
  searchQuery: string;
  page: number;
  rowsPerPage: number;
  error: string | null;
  statusFilter: AdminProductsStatusFilter;
};

const initialState: ProductsState = {
  rows: [],
  listLoader: false,
  actionLoader: false,
  searchQuery: '',
  page: 1,
  rowsPerPage: 25,
  error: null,
  statusFilter: 'all',
};

export const fetchAdminProducts = createAsyncThunk(
  'adminProducts/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { statusFilter } = (getState() as AdminRootState).adminProducts;
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const items = await adminProductsService.list(status);
      return items.map(toAdminProductRow);
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error, 'Failed to load products'));
    }
  },
);

export const publishAdminProduct = createAsyncThunk(
  'adminProducts/publish',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.publish(id);
      await dispatch(fetchAdminProducts());
      return id;
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error, 'Failed to publish product'));
    }
  },
);

export const archiveAdminProduct = createAsyncThunk(
  'adminProducts/archive',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await adminProductsService.archive(id);
      await dispatch(fetchAdminProducts());
      return id;
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error, 'Failed to deactivate product'));
    }
  },
);

const productsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
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
        state.rows = action.payload;
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
      });
  },
});

export const {
  setSearchQuery,
  setPage,
  setRowsPerPage,
  setStatusFilter,
  clearProductsError,
} = productsSlice.actions;

export default productsSlice.reducer;

export const selectAdminProductRows = (state: AdminRootState) => state.adminProducts.rows;

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
