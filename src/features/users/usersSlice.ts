// src/features/user/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  User, 
  UsersState, 
  UsersResponse, 
  FetchUsersParams,
  ApiResponse
} from '../../types';
import { apiService } from '../../services/api';

// Initial state
const initialState: UsersState = {
  users: [],
  pagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 0,
    totalUsers: 0
  },
  search: {
    query: '',
    isSearching: false
  },
  isLoading: false,
  searchLoading: false,
  error: null,
};

// Async thunks following your auth pattern
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (payload: FetchUsersParams, { rejectWithValue }) => {
    try {
      const response = await apiService.getUsers(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (payload: { query: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.searchUsers(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Search failed');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getUserById(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async (payload: { userId: string; updates: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateUser(payload.userId, payload.updates);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteUser(userId);
      return { userId, response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete user');
    }
  }
);

// Users slice following your auth slice pattern
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearch: (state) => {
      state.search.query = '';
      state.search.isSearching = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
      state.search.isSearching = action.payload.length > 0;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination.currentPage = 1;
      state.pagination.hasMore = true;
    },
    resetUsersState: () => initialState,
    // addUser: (state, action: PayloadAction<User>) => {
    //   state.users.unshift(action.payload);
    // },
    // updateUserInList: (state, action: PayloadAction<User>) => {
    //   const index = state.users.findIndex(user => user.id === action.payload.id);
    //   if (index !== -1) {
    //     state.users[index] = action.payload;
    //   }
    // },
    // removeUserFromList: (state, action: PayloadAction<string>) => {
    //   state.users = state.users.filter(user => user.id !== action.payload);
    // },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload;
        console.log(response, "RRR", response?.users);
        // const {users, pagination} = response.data;
        if (response?.users && response?.pagination) {
          
          const { users, pagination } = response;
          const { page } = action.meta.arg;
          console.log("inside",users);

          if (page === 1) {
            state.users = users;
          } else {
            state.users = [...state.users, ...users];
          }

          state.pagination = {
            currentPage: pagination.currentPage,
            hasMore: pagination.hasNext,
            totalPages: pagination.totalPages,
            totalUsers: pagination.totalUsers
          };
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        const response = action.payload;
        
        if (response?.users && response.pagination) {
          const { users, pagination } = response;
          const { page = 1 } = action.meta.arg;

          if (page === 1) {
            state.users = users;
          } else {
            state.users = [...state.users, ...users];
          }

          state.pagination = {
            currentPage: pagination.currentPage,
            hasMore: pagination.hasNext,
            totalPages: pagination.totalPages,
            totalUsers: pagination.totalUsers
          };
        }
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      })
      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        const response = action.payload;
        
        if (response.success && response.data) {
          const updatedUser = response.data as User;
          const userIndex = state.users.findIndex(user => user.id === updatedUser.id);
          if (userIndex !== -1) {
            state.users[userIndex] = updatedUser;
          }
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        const response = action.payload;
        
        if (response.success && response.data) {
          const updatedUser = response.data as User;
          const index = state.users.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        const { userId } = action.payload;
        state.users = state.users.filter(user => user.id !== userId);
      });
  },
});

export const { 
  clearError, 
  clearSearch, 
  setSearchQuery, 
  clearUsers,
  resetUsersState,
  // addUser,
  // updateUserInList,
  // removeUserFromList
} = usersSlice.actions;

export default usersSlice.reducer;