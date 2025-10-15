/**
 * ThemeToggle Component
 * 
 * Button to toggle between light and dark themes
 */

import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';

interface ThemeToggleProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ variant = 'ghost', size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const SunIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );

  const MoonIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current theme: ${theme}${theme === 'system' ? ` (${resolvedTheme})` : ''}`}
      leftIcon={resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
    >
      {showLabel && (resolvedTheme === 'dark' ? 'Dark' : 'Light')}
    </Button>
  );
}

export default ThemeToggle;
