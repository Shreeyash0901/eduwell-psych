import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback: string
  size?: 'sm' | 'md' | 'lg'
}

function Avatar({ className, fallback, size = 'md', ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium",
        {
          "h-8 w-8 text-sm": size === 'sm',
          "h-10 w-10 text-base": size === 'md',
          "h-12 w-12 text-lg": size === 'lg',
        },
        className
      )}
      {...props}
    >
      {fallback}
    </div>
  )
}

export { Avatar }
