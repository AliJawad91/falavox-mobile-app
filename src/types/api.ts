export interface ChannelTokenDataInterface {
  token: string;
  uid: number;
  expiresAt?: number;
  generatedAt?: number;
  channel: string;
}

export interface TokenApiResponse {
  data: ChannelTokenDataInterface;
}

export interface TranslationStartedPayload {
  palabraTask?: {
    data?: {
      task_id?: string;
      local_uid?: number; // translator UID from Palabra
      remote_uid?: number; // original speaker UID
      translations?: Array<{ local_uid?: number; remote_uid?: number }>;
    };
  };
}
export interface TranslationStartedPayloadAgain {
  success: boolean,
  taskId: string,
  translatorUid: number,
  sourceLanguage: string,
  targetLanguage: string,
  speakerUid: number,
  message: string

}
// Base API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  // tokens: Tokens
}

// Authentication payload types
export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
}

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profile?: any;
}

// Token types
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// User profile type
export interface UserProfile {
  _id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// Authentication response type
export interface AuthResponse <T = any> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
    tokens: Tokens
}

// { success: boolean; data: { tokens?: Tokens | undefined; }; error?: any; }
// Authentication state type
export interface AuthState {
  // user: UserProfile | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Add to your existing types in src/types/index.ts

export interface User {
  id: string;
  agoraId:number;
  userName: string; // Used for Voice IDs
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  success: boolean;
  // data?: {
    users: User[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      hasNext: boolean;
    // };
  };
  message: string;
  error?: string;
}

export interface FetchUsersParams {
  page: number;
  limit?: number;
  searchQuery?: string;
}

export interface UsersState {
  users: User[];
  pagination: {
    currentPage: number;
    hasMore: boolean;
    totalPages: number;
    totalUsers: number;
  };
  search: {
    query: string;
    isSearching: boolean;
  };
  isLoading: boolean;
  searchLoading: boolean;
  error: string | null;
}

// userProfile
export interface UserProfileState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}


