import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-on-primary hover:bg-on-primary-fixed-variant": variant === 'primary',
            "bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim": variant === 'secondary',
            "border border-outline bg-transparent hover:bg-surface-variant text-on-surface": variant === 'outline',
            "hover:bg-surface-variant text-on-surface hover:text-on-surface": variant === 'ghost',
            "bg-error text-on-error hover:bg-error-container hover:text-on-error-container": variant === 'error',
            "p-2 hover:bg-surface-variant rounded-full text-secondary": variant === 'icon',
            "h-8 px-3 text-xs": size === 'sm',
            "h-10 px-4 py-2": size === 'md',
            "h-12 px-6 text-lg": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
