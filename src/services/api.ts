// src/services/api.ts
import {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  RefreshTokenPayload,
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
  ApiResponse,
  UsersResponse,
  FetchUsersParams,
  User
} from '../types';
import { authApi } from './authApi';
import { usersApi } from './usersApi';

class ApiService {
  // Existing auth methods
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await authApi.post<{ data: AuthResponse }>('/auth/register', payload);
    return response.data.data;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await authApi.post<{ data: AuthResponse }>('/auth/login', payload);
    return response.data.data;
  }

  async refreshTokens(payload: RefreshTokenPayload): Promise<AuthResponse> {
    const response = await authApi.post<{ data: AuthResponse }>('/auth/refresh', payload);
    return response.data.data;
  }

  // async logout():{
  //   const response await
  // }
  async logout(refreshToken: string): Promise<void> {
    await authApi.post('/auth/logout', { refreshToken });
  }

  async logoutAll(): Promise<void> {
    await authApi.post('/auth/logout-all');
  }

  async getProfile(): Promise<UserProfile> {
    const response = await authApi.get<{ data: UserProfile }>('/auth/me');
    return response.data.data;
  }

  async updateProfile(updates: UpdateProfilePayload): Promise<UserProfile> {
    const response = await authApi.patch<{ data: UserProfile }>('/auth/me', updates);
    return response.data.data;
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await authApi.post('/auth/change-password', payload);
  }

  // New users methods following the same pattern
  async getUsers(payload: FetchUsersParams): Promise<UsersResponse> {
    const { page, limit = 3, searchQuery = '' } = payload;

    const params: any = { page, limit };
    if (searchQuery) {
      params.q = searchQuery;
    }

    const response = await authApi.get<{ data: UsersResponse }>('/user', { params });

    return response.data.data;
  }

  async searchUsers(payload: { query: string; page?: number; limit?: number }): Promise<UsersResponse> {
    const { query, page = 1, limit = 50 } = payload;

    const response = await usersApi.get<{ data: UsersResponse }>('/user/search', {
      params: { q: query, page, limit }
    });
    return response.data.data;
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    const response = await usersApi.get<{ data: ApiResponse<User> }>(`/user/${userId}`);
    return response.data.data;
  }

  async createUser(payload: Partial<User>): Promise<ApiResponse<User>> {
    const response = await usersApi.post<{ data: ApiResponse<User> }>('/user', payload);
    return response.data.data;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    const response = await usersApi.patch<{ data: ApiResponse<User> }>(`/user/${userId}`, updates);
    return response.data.data;
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    const response = await usersApi.delete<{ data: ApiResponse }>(`/user/${userId}`);
    return response.data.data;
  }

  // userProfile API's
  async getMe(): Promise<User> {
    console.log("before");
    
    const response =  await authApi.get('/user/me');
    // console.log(response,"responseee getMe");
    return response.data.data;
  }

  // Favorite methods
  async toggleFavorite(userId: string): Promise<ApiResponse<{ action: 'added' | 'removed' }>> {
    const response = await authApi.post<ApiResponse<{ action: 'added' | 'removed' }>>(
      `/favorites/${userId}/toggle`
    );
    return response.data;
  }

  async getMyFavorites(page?: number, limit?: number): Promise<ApiResponse<any>> {
    const response = await authApi.get<ApiResponse<any>>('/favorites/my-favorites', {
      params: { page, limit }
    });
    return response.data;
  }

  async checkFavorite(userId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const response = await authApi.get<ApiResponse<{ isFavorite: boolean }>>(
      `/favorites/check/${userId}`
    );
    return response.data;
  }
}

export const apiService = new ApiService();