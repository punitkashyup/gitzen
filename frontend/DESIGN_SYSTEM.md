# Design System Documentation

## Overview

This is a comprehensive design system built with:
- **CSS Variables** for theme support (light/dark mode)
- **Tailwind CSS** for utility-first styling
- **React Context** for theme management
- **TypeScript** for type safety
- **Modular Components** for reusability

## Table of Contents

1. [Getting Started](#getting-started)
2. [Theme System](#theme-system)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Components](#components)
7. [Usage Examples](#usage-examples)

---

## Getting Started

### Installation

The design system is already integrated into the project. All you need to do is:

1. Import the design system CSS in your app (already done in `App.tsx`):
```tsx
import './styles/design-system.css';
```

2. Wrap your app with `ThemeProvider` (already done in `App.tsx`):
```tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

---

## Theme System

### Theme Management

The theme system supports three modes:
- **Light**: Light theme
- **Dark**: Dark theme
- **System**: Automatically follows system preference

### Using the Theme Hook

```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      
      {/* Set specific theme */}
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('system')}>System</button>
      
      {/* Toggle between light/dark */}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Theme Toggle Component

Use the pre-built `ThemeToggle` component:

```tsx
import { ThemeToggle } from './components/ThemeToggle';

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

Props:
- `variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'` (default: 'ghost')
- `size?: 'sm' | 'md' | 'lg'` (default: 'md')
- `showLabel?: boolean` (default: false)

---

## Color Palette

### Primary Colors

Brand colors with full scale (50-900):

```tsx
// CSS Variables
var(--color-primary-50)   // Lightest
var(--color-primary-500)  // Main brand color: #3F3FF3
var(--color-primary-900)  // Darkest

// Tailwind Classes
bg-primary-50
text-primary-500
border-primary-600
```

### Neutral Colors (Grays)

```tsx
// CSS Variables
var(--color-neutral-0)    // White
var(--color-neutral-500)  // Medium gray
var(--color-neutral-900)  // Almost black

// Tailwind Classes
bg-neutral-100
text-neutral-600
border-neutral-300
```

### Semantic Colors

**Success (Green)**
```tsx
var(--color-success-500)  // #22c55e
bg-success-500
text-success-600
```

**Error (Red)**
```tsx
var(--color-error-500)  // #ef4444
bg-error-500
text-error-600
```

**Warning (Amber)**
```tsx
var(--color-warning-500)  // #f59e0b
bg-warning-500
text-warning-600
```

**Info (Blue)**
```tsx
var(--color-info-500)  // #3b82f6
bg-info-500
text-info-600
```

### Semantic Tokens (Theme-aware)

These automatically adjust for light/dark mode:

```tsx
// Backgrounds
var(--bg-primary)    // Main background
var(--bg-secondary)  // Secondary background
var(--bg-tertiary)   // Tertiary background

// Text
var(--text-primary)    // Primary text color
var(--text-secondary)  // Secondary text color
var(--text-tertiary)   // Tertiary text color

// Borders
var(--border-primary)    // Primary border color
var(--border-secondary)  // Secondary border color
var(--border-focus)      // Focus ring color
```

---

## Typography

### Font Families

```tsx
// CSS Variables
var(--font-sans)  // Inter, system fonts
var(--font-mono)  // Fira Code, monospace

// Tailwind Classes
font-sans
font-mono
```

### Font Sizes

```tsx
// CSS Variables
var(--text-xs)    // 12px
var(--text-sm)    // 14px
var(--text-base)  // 16px
var(--text-lg)    // 18px
var(--text-xl)    // 20px
var(--text-2xl)   // 24px
var(--text-3xl)   // 30px
var(--text-4xl)   // 36px
var(--text-5xl)   // 48px

// Tailwind Classes
text-xs
text-sm
text-base
text-lg
text-xl
text-2xl
text-3xl
text-4xl
text-5xl
```

### Font Weights

```tsx
// CSS Variables
var(--font-light)      // 300
var(--font-normal)     // 400
var(--font-medium)     // 500
var(--font-semibold)   // 600
var(--font-bold)       // 700

// Tailwind Classes
font-light
font-normal
font-medium
font-semibold
font-bold
```

---

## Spacing

Consistent spacing scale (4px base):

```tsx
// CSS Variables
var(--spacing-0)   // 0
var(--spacing-1)   // 4px
var(--spacing-2)   // 8px
var(--spacing-3)   // 12px
var(--spacing-4)   // 16px
var(--spacing-6)   // 24px
var(--spacing-8)   // 32px
var(--spacing-12)  // 48px
var(--spacing-16)  // 64px

// Tailwind Classes
p-4      // padding: 16px
m-6      // margin: 24px
gap-8    // gap: 32px
space-y-4  // vertical spacing
```

---

## Components

### Button

```tsx
import Button from './components/ui/Button';

// Primary Button
<Button variant="primary" size="md">
  Click me
</Button>

// Button with Icon
<Button
  variant="outline"
  leftIcon={<Icon />}
>
  With Icon
</Button>

// Loading State
<Button isLoading>
  Loading...
</Button>

// Full Width
<Button fullWidth>
  Full Width Button
</Button>
```

**Props:**
- `variant`: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
- `size`: 'sm' | 'md' | 'lg' | 'icon'
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

### Card

```tsx
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/Card';

<Card variant="default" padding="md">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated' | 'glass'
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `hover`: boolean (adds hover effect)

### Input

```tsx
import Input from './components/ui/Input';

// Basic Input
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
/>

// With Error
<Input
  label="Password"
  type="password"
  error="Password is required"
/>

// With Helper Text
<Input
  label="Username"
  helperText="Choose a unique username"
/>

// With Icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean
- All standard input props

---

## Usage Examples

### Page Layout with Theme Toggle

```tsx
import { ThemeToggle } from './components/ThemeToggle';
import Card, { CardHeader, CardTitle, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';

function MyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-0">
            My App
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 dark:text-neutral-400">
              This page uses the new design system with theme support.
            </p>
            <div className="mt-4 flex gap-4">
              <Button variant="primary">Primary Action</Button>
              <Button variant="outline">Secondary Action</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

### Form Example

```tsx
import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './components/ui/Card';
import Input from './components/ui/Input';
import Button from './components/ui/Button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Card variant="elevated" padding="lg" className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            fullWidth
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button
            variant="primary"
            type="submit"
            isLoading={loading}
            fullWidth
          >
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Dashboard with Stats Cards

```tsx
import Card, { CardHeader, CardTitle, CardContent } from './components/ui/Card';

function Dashboard() {
  const stats = [
    { title: 'Total Users', value: '1,234', change: '+12%' },
    { title: 'Revenue', value: '$45.2K', change: '+8%' },
    { title: 'Active Projects', value: '23', change: '+3' },
    { title: 'Completion Rate', value: '94%', change: '+2%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} hover>
          <CardHeader>
            <CardTitle className="text-lg">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">
              {stat.value}
            </p>
            <p className="text-sm text-success-600 dark:text-success-500">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Use Semantic Tokens

Always use semantic tokens for colors that should adapt to theme:

✅ **Good:**
```tsx
<div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
```

❌ **Bad:**
```tsx
<div style={{ backgroundColor: '#ffffff', color: '#000000' }} />
```

### 2. Use Tailwind's Dark Mode

Use Tailwind's `dark:` prefix for theme-specific styles:

```tsx
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-0">
  Content
</div>
```

### 3. Use Design System Components

Prefer using the design system components over raw HTML:

✅ **Good:**
```tsx
import Button from './components/ui/Button';
<Button variant="primary">Click me</Button>
```

❌ **Bad:**
```tsx
<button style={{ background: '#3F3FF3', color: 'white' }}>Click me</button>
```

### 4. Maintain Accessibility

- Always provide proper ARIA labels
- Ensure sufficient color contrast (WCAG AA minimum)
- Support keyboard navigation
- Use semantic HTML

### 5. Keep Components Modular

- Build small, reusable components
- Use composition over inheritance
- Keep components loosely coupled
- Follow single responsibility principle

---

## Migration Guide

### From Old Inline Styles to New System

**Before:**
```tsx
<button
  style={{
    backgroundColor: '#3F3FF3',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
  }}
>
  Click me
</button>
```

**After:**
```tsx
import Button from './components/ui/Button';

<Button variant="primary" size="md">
  Click me
</Button>
```

### From tokens.ts to CSS Variables

**Before:**
```tsx
import { colors } from './design/tokens';

<div style={{ color: colors.primary[500] }} />
```

**After:**
```tsx
<div className="text-primary-500" />
// or
<div style={{ color: 'var(--color-primary-500)' }} />
```

---

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Context**: https://react.dev/reference/react/useContext

---

## Support

For questions or issues with the design system, please reach out to the development team or open an issue in the repository.
