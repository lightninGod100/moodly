// src/components/ui/Button.tsx
import React from 'react';

// Button variant types
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  style = {},
  ...props
}) => {
  // Base styles using CSS custom properties
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--font-medium)',
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-normal)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    outline: 'none',
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  // Variant-specific styles
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary-500)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      backgroundColor: 'var(--neutral-100)',
      color: 'var(--neutral-900)',
      border: '1px solid var(--neutral-200)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-500)',
      border: '2px solid var(--primary-500)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--primary-500)',
      border: 'none',
    }
  };

  // Size-specific styles
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--text-sm)',
    },
    md: {
      padding: 'var(--space-3) var(--space-4)',
      fontSize: 'var(--text-base)',
    },
    lg: {
      padding: 'var(--space-4) var(--space-6)',
      fontSize: 'var(--text-lg)',
    }
  };

  // Hover styles (applied via CSS)
  const hoverClass = `button-${variant}`;

  // Combine all styles
  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <>
      {/* Add hover styles via CSS */}
      <style>{`
        .button-primary:hover:not(:disabled) {
          background-color: var(--primary-600) !important;
          box-shadow: var(--shadow-md) !important;
        }
        .button-secondary:hover:not(:disabled) {
          background-color: var(--neutral-200) !important;
        }
        .button-outline:hover:not(:disabled) {
          background-color: var(--primary-50) !important;
        }
        .button-ghost:hover:not(:disabled) {
          background-color: var(--primary-50) !important;
        }
        .button-primary:focus {
          outline: 2px solid var(--primary-500);
          outline-offset: 2px;
        }
      `}</style>
      
      <button
        className={`${hoverClass} ${className}`}
        style={combinedStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid currentColor',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: 'var(--space-2)'
              }}
            />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
      
      {/* Keyframe animation for loading spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Button;