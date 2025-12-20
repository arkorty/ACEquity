import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types/user';
import { setCookie, destroyCookie, parseCookies } from 'nookies';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

export const fetchUser = createAsyncThunk('auth/fetchUser', async (userid: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userid}`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    const data = await response.json();
    setCookie(null, 'userid', data.response.userid, { maxAge: 30 * 24 * 60 * 60, path: '/' });
    return data.response as User;
  } catch (error: any) {
    destroyCookie(null, 'userid', { path: '/' });
    return rejectWithValue(error.message);
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'OTP verification failed');
    }
    const data = await response.json();
    setCookie(null, 'userid', data.response.userid, { maxAge: 30 * 24 * 60 * 60, path: '/' });
    return data.response as User;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      destroyCookie(null, 'userid', { path: '/' });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setLoading } = authSlice.actions;
export default authSlice.reducer;