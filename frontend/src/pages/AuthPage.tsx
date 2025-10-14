/**
 * Unified Authentication Page
 * 
 * Combined login/register/forgot password page with modern UI/UX
 * Based on the reference template design
 */
import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import apiClient, { getErrorMessage } from '../lib/api-client';
import { Button, Input, Label, Separator } from '../components/ui';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

type ViewType = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, login: githubLogin } = useAuthStore();

  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle login submission
   */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const { user, access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle registration submission
   */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { user, access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle forgot password submission
   */
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement forgot password endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setError('Password reset link sent to your email!');
      setTimeout(() => setCurrentView('login'), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (currentView === 'login') {
      handleLogin(e);
    } else if (currentView === 'register') {
      handleRegister(e);
    } else {
      handleForgotPassword(e);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel - Brand Section */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: '#3F3FF3' }}
      >
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="#3F3FF3"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Gitzen</h1>
          </div>

          {/* Marketing Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight font-bold">
              Effortlessly detect and cleanup secrets in your repositories.
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Privacy-first Git secret detection tool. Never stores actual secret values,
              ensuring your data remains secure.
            </p>
            <div className="mt-8 space-y-3 text-white/80">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Detect secrets across multiple repositories</span>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Privacy-safe - never stores actual secrets</span>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Guided cleanup workflow</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>Copyright © 2025 Gitzen Enterprises.</span>
            <Link to="/privacy" className="cursor-pointer hover:text-white/90">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#3F3FF3' }}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Gitzen</h1>
          </div>

          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center relative">
              {currentView === 'forgot' && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('login')}
                  className="absolute left-0 top-0 p-2 hover:bg-accent"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-3xl font-bold text-foreground">
                {currentView === 'login' && 'Welcome Back'}
                {currentView === 'register' && 'Create Account'}
                {currentView === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-muted-foreground">
                {currentView === 'login' && 'Enter your email and password to access your account.'}
                {currentView === 'register' && 'Create a new account to get started with Gitzen.'}
                {currentView === 'forgot' && "Enter your email address and we'll send you a reset link."}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-destructive"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentView === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={isLoading}
                    className="h-12"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  className="h-12"
                  required
                />
              </div>

              {currentView !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={isLoading}
                      className="h-12 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentView === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      disabled={isLoading}
                      className="h-12 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentView === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({ ...formData, rememberMe: e.target.checked })
                      }
                      className="rounded border-input cursor-pointer"
                    />
                    <Label htmlFor="remember" className="cursor-pointer font-normal">
                      Remember Me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setCurrentView('forgot')}
                  >
                    Forgot Your Password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-sm font-medium"
                style={{ backgroundColor: '#3F3FF3' }}
                disabled={isLoading}
                isLoading={isLoading}
              >
                {currentView === 'login' && 'Log In'}
                {currentView === 'register' && 'Create Account'}
                {currentView === 'forgot' && 'Send Reset Link'}
              </Button>
            </form>

            {currentView !== 'forgot' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or {currentView === 'login' ? 'Login' : 'Sign Up'} With
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={() => {
                      // TODO: Implement Google OAuth
                      console.log('Google OAuth');
                    }}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={githubLogin}
                    disabled={isLoading}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm text-muted-foreground">
              {currentView === 'login' && (
                <>
                  Don't Have An Account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm font-medium"
                    onClick={() => setCurrentView('register')}
                  >
                    Register Now.
                  </Button>
                </>
              )}
              {currentView === 'register' && (
                <>
                  Already Have An Account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm font-medium"
                    onClick={() => setCurrentView('login')}
                  >
                    Sign In.
                  </Button>
                </>
              )}
              {currentView === 'forgot' && (
                <>
                  Remember Your Password?{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm font-medium"
                    onClick={() => setCurrentView('login')}
                  >
                    Back to Login.
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
