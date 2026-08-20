import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminAuthService } from '../../../services/admin/auth-service';
import { restoreStoredSession } from '../../../lib/admin/auth-session';
import { getLoginErrorMessage } from '../../../lib/admin/login-error-message';

export const loginStaff = createAsyncThunk(
  'adminAuth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const session = await adminAuthService.login(email, password);
      return session.user;
    } catch (e) {
      return rejectWithValue(getLoginErrorMessage(e));
    }
  },
);

export const logoutStaff = createAsyncThunk('adminAuth/logout', async () => {
  await adminAuthService.logout();
});

export const bootstrapAdminSession = createAsyncThunk(
  'adminAuth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const session = await restoreStoredSession();
      return session?.user ?? null;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  },
);

export const requestPasswordReset = createAsyncThunk(
  'adminAuth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      await adminAuthService.requestPasswordReset(email);
      return true;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  },
);

const authSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    user: null as unknown | null,
    status: 'idle' as 'idle' | 'loading' | 'error',
    bootstrapped: false,
    error: null as string | null,
    resetSent: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearResetSent: (state) => {
      state.resetSent = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginStaff.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'idle';
      })
      .addCase(loginStaff.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Sign in failed';
      })
      .addCase(logoutStaff.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      .addCase(bootstrapAdminSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(bootstrapAdminSession.rejected, (state) => {
        state.user = null;
        state.bootstrapped = true;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.resetSent = true;
        state.status = 'idle';
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Request failed';
      });
  },
});

export const { clearError, clearResetSent } = authSlice.actions;
export default authSlice.reducer;
