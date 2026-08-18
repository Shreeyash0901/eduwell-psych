import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = '', ...props }, ref) => {
    const baseStyles =
      'w-full bg-slate-50 border rounded-lg p-3 font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-xs';

    const errorStyles = hasError
      ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
      : 'border-slate-200';

    return (
      <textarea
        ref={ref}
        aria-invalid={hasError ? 'true' : undefined}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
