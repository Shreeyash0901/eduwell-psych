import React from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError = false, options, children, className = '', ...props }, ref) => {
    const baseStyles =
      'w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-xs cursor-pointer';

    const errorStyles = hasError
      ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
      : 'border-slate-200';

    return (
      <select
        ref={ref}
        aria-invalid={hasError ? 'true' : undefined}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = 'Select';
