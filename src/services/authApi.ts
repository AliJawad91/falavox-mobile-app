// src/services/authApi.ts
import axios from 'axios';
import { store } from '../store/index';
import { refreshTokens, logout } from '../features/auth/authSlice';

const API_BASE_URL = 'https://untreated-nonvisional-neriah.ngrok-free.dev/api'; // Replace with your API URL

// Create axios instance
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token refresh management
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - adds auth token to every request
authApi.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.tokens?.accessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response interceptor - handles token refresh automatically
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Check if refresh token exists before attempting refresh
      const state = store.getState();
      const refreshToken = state.auth.tokens?.refreshToken;
      
      // If no refresh token available, reject with original error
      if (!refreshToken) {
        // Return the original authentication error instead of refresh token error
        if (error.response) {
          const { status, data } = error.response;
          const formattedError = {
            success: false,
            message: data?.message || data?.error || `Authentication failed with status ${status}`,
            error: data?.error || 'AUTH_ERROR',
            status: status,
            data: data?.data || null
          };
          return Promise.reject(formattedError);
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return authApi(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token API
        const result = await store.dispatch(refreshTokens({ refreshToken })).unwrap();
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
        
        // Process queued requests with new token
        processQueue(null, result.tokens.accessToken);
        
        // Retry the original request
        return authApi(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user and reject all queued requests
        processQueue(refreshError, null);
        store.dispatch(logout());
        
        // Return the original error instead of refresh error for better UX
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      
      // Create a consistent error format that matches your ApiResponse
      const formattedError = {
        success: false,
        message: data?.message || data?.error || `Request failed with status ${status}`,
        error: data?.error || 'API_ERROR',
        status: status,
        data: data?.data || null
      };
      
      return Promise.reject(formattedError);
    }

    // Handle network errors
    if (error.request) {
      return Promise.reject({
        success: false,
        message: 'Network error: Unable to connect to server',
        error: 'NETWORK_ERROR'
      });
    }

    return Promise.reject({
      success: false,
      message: error.message || 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR'
    });
  }
);
// Response interceptor - handles token refresh automatically
// authApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If 401 error and not already retrying
//     if (error.response?.status === 401 && !originalRequest._retry) {
      
//       if (isRefreshing) {
//         // If already refreshing, add to queue
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(token => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return authApi(originalRequest);
//         }).catch(err => {
//           return Promise.reject(err);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const state = store.getState();
//         const refreshToken = state.auth.tokens?.refreshToken;
        
//         if (!refreshToken) {
//           throw new Error('No refresh token available');
//         }

//         // Call refresh token API
//         const result = await store.dispatch(refreshTokens({ refreshToken })).unwrap();
        
//         // Update the original request with new token
//         originalRequest.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
        
//         // Process queued requests with new token
//         processQueue(null, result.tokens.accessToken);
        
//         // Retry the original request
//         return authApi(originalRequest);
//       } catch (refreshError) {
//         // If refresh fails, logout user and reject all queued requests
//         processQueue(refreshError, null);
//         store.dispatch(logout());
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     if (error.response) {
//       const { status, data } = error.response;
      
//       // Create a consistent error format that matches your ApiResponse
//       const formattedError = {
//         success: false,
//         message: data?.message || data?.error || `Request failed with status ${status}`,
//         error: data?.error || 'API_ERROR',
//         status: status,
//         data: data?.data || null
//       };
      
//       return Promise.reject(formattedError);
//     }

//     // Handle network errors
//     if (error.request) {
//       return Promise.reject({
//         success: false,
//         message: 'Network error: Unable to connect to server',
//         error: 'NETWORK_ERROR'
//       });
//     }

//     // return Promise.reject(error);
//     return Promise.reject({
//       success: false,
//       message: error.message || 'An unexpected error occurred',
//       error: 'UNKNOWN_ERROR'
//     });
//   }
// );