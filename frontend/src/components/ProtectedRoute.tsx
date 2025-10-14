/**
 * Protected Route Component
 * 
 * Wrapper component that requires authentication to access child routes.
 */
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // Check authentication on mount only if we have a token
  useEffect(() => {
    const hasToken = localStorage.getItem('access_token');
    
    // Only check auth if we have a token or if the store says we're authenticated
    // This prevents unnecessary API calls on initial load
    if ((hasToken || isAuthenticated) && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading spinner while checking auth (but only if we had a token)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
