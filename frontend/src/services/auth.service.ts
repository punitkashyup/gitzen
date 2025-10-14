/**
 * Authentication Service
 * 
 * API calls for authentication endpoints.
 */
import apiClient from '../lib/api-client';

export interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  auth_provider: string;
  email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/**
 * Initiate GitHub OAuth login
 * Redirects to GitHub authorization page
 */
export const initiateLogin = (redirectUri?: string): void => {
  const params = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
  window.location.href = `${import.meta.env.VITE_API_URL}${import.meta.env.VITE_API_PREFIX}/auth/login${params}`;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('access_token');
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<{ access_token: string; expires_in: number }> => {
  const response = await apiClient.post<{ access_token: string; token_type: string; expires_in: number }>('/auth/refresh');
  return response.data;
};

/**
 * Auth service object
 */
const authService = {
  initiateLogin,
  getCurrentUser,
  logout,
  refreshToken,
};

export default authService;
