import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const baseInputStyles =
      'w-full bg-slate-50 border rounded-lg font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-xs';

    const paddingStyles = leftIcon
      ? 'pl-10 pr-3.5 py-2.5'
      : rightIcon
      ? 'pl-3.5 pr-10 py-2.5'
      : 'p-2.5';

    const errorStyles = hasError
      ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
      : 'border-slate-200';

    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            aria-invalid={hasError ? 'true' : undefined}
            className={`${baseInputStyles} ${paddingStyles} ${errorStyles} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        aria-invalid={hasError ? 'true' : undefined}
        className={`${baseInputStyles} ${paddingStyles} ${errorStyles} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
