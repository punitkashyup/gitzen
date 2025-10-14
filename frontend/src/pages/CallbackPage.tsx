/**
 * OAuth Callback Page
 * 
 * Handles the OAuth callback from GitHub, processes the token, and redirects to dashboard.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in query params (OAuth error)
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Check for access token in query params (returned by backend)
      const token = searchParams.get('token');
      if (token) {
        // Store token in localStorage
        localStorage.setItem('access_token', token);
      }

      // Check authentication status (will fetch user profile)
      try {
        await checkAuth();
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError('Failed to authenticate. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, checkAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-2xl">
        {error ? (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we verify your authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}
