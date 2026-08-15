import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'stable' | 'monitoring' | 'urgent' | 'normal' | 'attention'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        {
          "bg-surface-variant text-on-surface-variant": variant === 'default',
          "bg-primary/10 text-primary": variant === 'stable',
          "bg-tertiary-container/10 text-tertiary": variant === 'monitoring' || variant === 'attention',
          "bg-error-container text-on-error-container": variant === 'urgent',
          "bg-secondary-container/50 text-on-secondary-container": variant === 'normal',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
