/**
 * Authentication Store
 * 
 * Global state management for authentication using Zustand.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../services/auth.service';
import authService from '../services/auth.service';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Initiate login (redirects to GitHub)
      login: () => {
        authService.initiateLogin(window.location.origin + '/callback');
      },

      // Logout user
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Clear local state even if API call fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Check authentication status
      checkAuth: async () => {
        // Don't check if already loading
        if (get().isLoading) return;

        // Don't check if no token exists (prevents unnecessary API calls)
        const hasToken = localStorage.getItem('access_token');
        if (!hasToken && !get().isAuthenticated) {
          // No token and not authenticated - set clean state without API call
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Clear auth state on error
          localStorage.removeItem('access_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // Don't show error for failed auth check
          });
        }
      },
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Auth store selectors
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
