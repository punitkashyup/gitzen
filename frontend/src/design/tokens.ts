/**
 * Gitzen Design Tokens
 * 
 * Global design system variables for consistent UI/UX
 * Modular and scalable approach to design tokens
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d6ff',
    300: '#a4baff',
    400: '#8194ff',
    500: '#3F3FF3', // Main brand color
    600: '#3636d4',
    700: '#2c2cb5',
    800: '#242496',
    900: '#1e1e7a',
    950: '#13134d',
  },

  // Neutral/Gray scale
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Semantic colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Status-specific colors
  status: {
    open: '#ef4444',      // Red for open findings
    inProgress: '#f59e0b', // Amber for in progress
    resolved: '#10b981',   // Green for resolved
    falsePositive: '#6b7280', // Gray for false positives
  },

  // Severity colors
  severity: {
    critical: '#dc2626',   // Red
    high: '#ea580c',       // Orange-red
    medium: '#d97706',     // Orange
    low: '#65a30d',        // Yellow-green
    info: '#2563eb',       // Blue
  }
} as const;

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"'
    ].join(', '),
    mono: [
      '"Fira Code"',
      '"JetBrains Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'Monaco',
      '"Courier New"',
      'monospace'
    ].join(', '),
  },

  // Font sizes with line heights
  fontSize: {
    xs: { size: '12px', lineHeight: '16px' },
    sm: { size: '14px', lineHeight: '20px' },
    base: { size: '16px', lineHeight: '24px' },
    lg: { size: '18px', lineHeight: '28px' },
    xl: { size: '20px', lineHeight: '28px' },
    '2xl': { size: '24px', lineHeight: '32px' },
    '3xl': { size: '30px', lineHeight: '36px' },
    '4xl': { size: '36px', lineHeight: '40px' },
    '5xl': { size: '48px', lineHeight: '1' },
    '6xl': { size: '60px', lineHeight: '1' },
    '7xl': { size: '72px', lineHeight: '1' },
    '8xl': { size: '96px', lineHeight: '1' },
    '9xl': { size: '128px', lineHeight: '1' },
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

export const spacing = {
  // Spacing scale (in rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

export const transitions = {
  // Duration
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  // Timing functions
  timing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common transition properties
  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: spacing[8],      // 32px
      md: spacing[10],     // 40px
      lg: spacing[12],     // 48px
    },
    padding: {
      sm: `${spacing[1.5]} ${spacing[3]}`,  // 6px 12px
      md: `${spacing[2]} ${spacing[4]}`,    // 8px 16px
      lg: `${spacing[2.5]} ${spacing[6]}`,  // 10px 24px
    },
  },

  input: {
    height: {
      sm: spacing[8],      // 32px
      md: spacing[10],     // 40px
      lg: spacing[12],     // 48px
    },
    padding: {
      sm: `${spacing[1.5]} ${spacing[3]}`,  // 6px 12px
      md: `${spacing[2]} ${spacing[4]}`,    // 8px 16px
      lg: `${spacing[2.5]} ${spacing[6]}`,  // 10px 24px
    },
  },

  card: {
    padding: {
      sm: spacing[4],      // 16px
      md: spacing[6],      // 24px
      lg: spacing[8],      // 32px
    },
    borderRadius: borderRadius.lg,
    shadow: shadows.base,
  },

  table: {
    cell: {
      padding: `${spacing[3]} ${spacing[4]}`, // 12px 16px
    },
    header: {
      padding: `${spacing[3]} ${spacing[4]}`, // 12px 16px
    },
  },
} as const;

// Utility function to get CSS custom properties
export const getCSSVariables = () => {
  const cssVars: Record<string, string> = {};

  // Colors
  Object.entries(colors).forEach(([colorName, colorValues]) => {
    if (typeof colorValues === 'object') {
      Object.entries(colorValues).forEach(([shade, value]) => {
        cssVars[`--color-${colorName}-${shade}`] = value;
      });
    } else {
      cssVars[`--color-${colorName}`] = colorValues;
    }
  });

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Typography
  cssVars['--font-sans'] = typography.fontFamily.sans;
  cssVars['--font-mono'] = typography.fontFamily.mono;

  return cssVars;
};

// Export all tokens as default
const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  components,
  getCSSVariables,
} as const;

export default designTokens;