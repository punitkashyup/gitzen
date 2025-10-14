import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variantStyles = {
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm active:scale-[0.98]',
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm active:scale-[0.98]',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary shadow-sm active:scale-[0.98]',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary active:scale-[0.98]',
      ghost:
        'hover:bg-accent hover:text-accent-foreground focus:ring-primary active:scale-[0.98]',
      danger:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm active:scale-[0.98]',
      link: 'text-primary underline-offset-4 hover:underline focus:ring-primary',
    };

    const sizeStyles = {
      sm: 'h-8 text-sm px-3 py-1.5 gap-1.5 rounded-md',
      md: 'h-10 text-base px-4 py-2 gap-2',
      lg: 'h-12 text-lg px-6 py-3 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
