/**
 * API Client Configuration
 * 
 * Axios instance with interceptors for authentication and error handling.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

/**
 * Base API client with authentication support
 */
export const apiClient = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is sent via HTTP-only cookie automatically
    // But we can also support Authorization header for API keys
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Track if we're currently refreshing to prevent multiple refresh attempts
 */
let isRefreshing = false;

/**
 * Response interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      // Check if we have a token to refresh - if not, just fail
      const hasToken = localStorage.getItem('access_token') || document.cookie.includes('access_token');
      
      if (!hasToken) {
        // No token to refresh, just reject
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        await apiClient.post('/auth/refresh');
        isRefreshing = false;
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear state and reject
        isRefreshing = false;
        localStorage.removeItem('access_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error type
 */
export interface APIError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError;
    return apiError?.detail || apiError?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export default apiClient;
