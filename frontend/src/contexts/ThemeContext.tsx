/**
 * Theme Context and Provider
 * 
 * Provides theme management functionality with support for:
 * - Light/Dark/System modes
 * - localStorage persistence
 * - System preference detection
 * - Smooth theme transitions
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Resolve system preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Apply theme to document
  const applyTheme = (newTheme: ResolvedTheme) => {
    const root = document.documentElement;
    
    // Remove preload class to enable transitions
    root.classList.remove('preload');
    
    // Apply theme
    root.setAttribute('data-theme', newTheme);
    
    // Update color-scheme for native browser elements
    root.style.colorScheme = newTheme;
    
    setResolvedTheme(newTheme);
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  // Watch for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(getSystemTheme());
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    // Add preload class to prevent transitions on initial load
    document.documentElement.classList.add('preload');
    
    const themeToApply = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(themeToApply);
    
    // Remove preload after a short delay
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get current resolved theme (light or dark)
 * Useful for conditional rendering based on theme
 * 
 * @example
 * ```tsx
 * function Logo() {
 *   const isDark = useResolvedTheme() === 'dark';
 *   return <img src={isDark ? '/logo-dark.svg' : '/logo-light.svg'} />;
 * }
 * ```
 */
export function useResolvedTheme(): ResolvedTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}

/**
 * Hook to check if dark mode is active
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDark = useIsDarkMode();
 *   return <div>{isDark ? '🌙' : '☀️'}</div>;
 * }
 * ```
 */
export function useIsDarkMode(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
}
