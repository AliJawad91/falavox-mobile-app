import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { User } from '../../types/api'; // Import your existing User type

// Remove the FavoriteUser interface and use your existing User type
interface FavoritesState {
  favorites: User[]; // Use User[] instead of FavoriteUser[]
  pagination: {
    currentPage: number;
    hasMore: boolean;
    totalPages: number;
    totalFavorites: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: FavoritesState = {
  favorites: [],
  pagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 0,
    totalFavorites: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks (keep the same)
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (payload: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.getMyFavorites(payload.page, payload.limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch favorites');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log("toggleFavorite",userId);
      
      const response = await apiService.toggleFavorite(userId);
      return { userId, response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle favorite');
    }
  }
);

// Update the slice to use User type
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFavorites: (state) => {
      state.favorites = [];
      state.pagination.currentPage = 1;
      state.pagination.hasMore = true;
    },
    resetFavoritesState: () => initialState,
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(user => user.id !== action.payload);
      state.pagination.totalFavorites = Math.max(0, state.pagination.totalFavorites - 1);
    },
    addFavorite: (state, action: PayloadAction<User>) => { // Use User type here
      // Prevent duplicates
      if (!state.favorites.find(user => user.id === action.payload.id)) {
        state.favorites.unshift(action.payload);
        state.pagination.totalFavorites += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload;
        
        if (response?.success && response.data) {
          const { favorites, pagination } = response.data;
          const { page = 1 } = action.meta.arg;

          // Transform favorites to ensure they use 'id' instead of '_id'
          const transformedFavorites = favorites.map((user: any) => ({
            ...user,
            id: user.id || user._id, // Use id if available, otherwise use _id
          }));

          if (page === 1) {
            state.favorites = transformedFavorites;
          } else {
            // Append for pagination
            const existingIds = new Set(state.favorites.map(user => user.id));
            const newFavorites = transformedFavorites.filter((user: User) => !existingIds.has(user.id));
            state.favorites = [...state.favorites, ...newFavorites];
          }

          state.pagination = {
            currentPage: pagination.page || 1,
            hasMore: pagination.hasMore || false,
            totalPages: pagination.totalPages || 1,
            totalFavorites: pagination.total || 0
          };
        }
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Toggle Favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { userId, response } = action.payload;
        
        if (response?.success && response.data) {
          const { action: favoriteAction } = response.data;
          
          if (favoriteAction === 'removed') {
            state.favorites = state.favorites.filter(user => user.id !== userId);
            state.pagination.totalFavorites = Math.max(0, state.pagination.totalFavorites - 1);
          }
        }
      });
  },
});

export const {
  clearError,
  clearFavorites,
  resetFavoritesState,
  removeFavorite,
  addFavorite,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;