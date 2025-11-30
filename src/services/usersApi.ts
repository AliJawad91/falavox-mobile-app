// src/services/usersApi.ts
import axios from 'axios';
import { store } from '../store/index';

const API_BASE_URL = 'https://untreated-nonvisional-neriah.ngrok-free.dev/api';

// Create axios instance for users API
export const usersApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - adds auth token to every request (same as authApi)
usersApi.interceptors.request.use(
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

// Response interceptor - uses the same error handling as authApi
usersApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const state = store.getState();
      const refreshToken = state.auth.tokens?.refreshToken;
      
      if (!refreshToken) {
        return Promise.reject({
          success: false,
          message: 'Authentication required',
          error: 'AUTH_REQUIRED'
        });
      }

      originalRequest._retry = true;

      try {
        // Use the same refresh logic as authApi
        const result = await store.dispatch(refreshTokens({ refreshToken })).unwrap();
        originalRequest.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
        return usersApi(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      
      const formattedError = {
        success: false,
        message: data?.message || data?.error || `Request failed with status ${status}`,
        error: data?.error || 'API_ERROR',
        status: status,
        data: data?.data || null
      };
      
      return Promise.reject(formattedError);
    }

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