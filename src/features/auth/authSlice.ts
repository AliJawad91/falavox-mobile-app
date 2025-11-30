// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthResponse, RegisterPayload, LoginPayload, RefreshTokenPayload, ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '../../types';
import { apiService } from '../../services/api';
import TokenService from '../../services/tokenService';

// Initial state
const initialState: AuthState = {
  // user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loadTokens = createAsyncThunk(
  'auth/loadTokens',
  async () => {
    const accessToken = await TokenService.getAccessToken();
    const refreshToken = await TokenService.getRefreshToken();

    return { accessToken, refreshToken };
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      console.log(payload, "payload");

      const response = await apiService.register(payload);
      const { accessToken, refreshToken } = response.tokens;
      console.log(accessToken, refreshToken,"accessToken, refreshToken",response.tokens);
      
      await TokenService.setTokens(accessToken, refreshToken)
      // console.log(response, "response");

      return response;
    } catch (error: any) {
      console.log(error, "ErroRRRR catch");

      return rejectWithValue(error.message || 'Registration Failed!');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.login(payload);
      const { accessToken, refreshToken } = response.tokens;
      await TokenService.setTokens(accessToken, refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshTokens = createAsyncThunk(
  'auth/refresh',
  async (payload: RefreshTokenPayload, { rejectWithValue }) => {
    try {
      return await apiService.refreshTokens(payload);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await TokenService.getRefreshToken();
      console.log(refreshToken,"refresh Tokwn");
      
      await apiService.logout(refreshToken || "asd");
      await TokenService.clearTokens();
      // const a = await TokenService.getAccessToken();
      // console.log(a, "test token service token clearance");
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// export const getProfile = createAsyncThunk(
//   'auth/getProfile',
//   async (_, { rejectWithValue }) => {
//     try {
//       return await apiService.getProfile();
//     } catch (error: any) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const updateProfile = createAsyncThunk(
//   'auth/updateProfile',
//   async (updates: UpdateProfilePayload, { rejectWithValue }) => {
//     try {
//       return await apiService.updateProfile(updates);
//     } catch (error: any) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      // state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        console.log(action.payload, "Errors LOGS");

        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Refresh tokens
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.tokens = action.payload.tokens;
      })
      .addCase(refreshTokens.rejected, (state) => {
        // state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        // state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      })
    // // Get profile
    // .addCase(getProfile.fulfilled, (state, action) => {
    //   state.user = action.payload;
    // })
    // // Update profile
    // .addCase(updateProfile.fulfilled, (state, action) => {
    //   state.user = action.payload;
    // });
  },
});

export const { clearError, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;