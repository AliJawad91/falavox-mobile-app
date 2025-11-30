// src/features/user/userProfileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, ApiResponse } from '../../types';
import { apiService } from '../../services/api';
import { UserProfileState } from '../../types';


const initialState: UserProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const getMe = createAsyncThunk(
  'userProfile/getMe',
  async (_, { rejectWithValue }) => {
    try {
        console.log("fetch Current User");
        
      const response = await apiService.getMe();
      console.log(response,"response after");
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

// export const updateMe = createAsyncThunk(
//   'userProfile/updateMe',
//   async (updates: Partial<User>, { rejectWithValue }) => {
//     try {
//       const response = await apiService.updateMe(updates);
//       return response;
//     } catch (error: any) {
//       return rejectWithValue(error.message || 'Failed to update profile');
//     }
//   }
// );

// User profile slice
const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setMe: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    clearMe: (state) => {
      state.profile = null;
      state.lastUpdated = null;
      state.error = null;
    },
    updateMe: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetMe: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Current User
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload;
        // console.log(response,"response at case",response.data,".data");
        
        // if (response.success && response.data) {
          state.profile = response;
          state.lastUpdated = new Date().toISOString();
        // }
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Current User
    //   .addCase(updateMe.pending, (state) => {
    //     state.isLoading = true;
    //     state.error = null;
    //   })
    //   .addCase(updateMe.fulfilled, (state, action) => {
    //     state.isLoading = false;
    //     const response = action.payload;
        
    //     if (response.success && response.data) {
    //       state.Profile = response.data as User;
    //       state.lastUpdated = new Date().toISOString();
    //     }
    //   })
    //   .addCase(updateMe.rejected, (state, action) => {
    //     state.isLoading = false;
    //     state.error = action.payload as string;
    //   });
  },
});

export const { 
  setMe, 
  clearMe, 
  updateMe, 
  clearError, 
  resetMe 
} = userProfileSlice.actions;

export default userProfileSlice.reducer;