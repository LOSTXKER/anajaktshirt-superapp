import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/modules/shared/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-[#1D1D1F] text-white",
        secondary: "bg-[#F5F5F7] text-[#1D1D1F]",
        outline: "border border-[#D2D2D7] text-[#1D1D1F] bg-white",
        destructive: "bg-[#FF3B30]/10 text-[#FF3B30]",
        success: "bg-[#34C759]/10 text-[#34C759]",
        warning: "bg-[#FF9500]/10 text-[#FF9500]",
        info: "bg-[#007AFF]/10 text-[#007AFF]",
        purple: "bg-[#AF52DE]/10 text-[#AF52DE]",
      },
      size: {
        default: "px-2.5 py-1 text-[12px]",
        sm: "px-2 py-0.5 text-[11px]",
        lg: "px-3 py-1.5 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
  icon?: React.ReactNode
}

function Badge({ className, variant, size, dot, dotColor, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span 
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            dotColor || (
              variant === 'success' ? "bg-[#34C759]" :
              variant === 'destructive' ? "bg-[#FF3B30]" :
              variant === 'warning' ? "bg-[#FF9500]" :
              variant === 'info' ? "bg-[#007AFF]" :
              "bg-[#86868B]"
            )
          )} 
        />
      )}
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

// Status Badge with animated dot
interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'busy' | 'away'
  label?: string
}

function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-[#34C759]', bgColor: 'bg-[#34C759]/10', textColor: 'text-[#34C759]', label: 'Online' },
    offline: { color: 'bg-[#86868B]', bgColor: 'bg-[#F5F5F7]', textColor: 'text-[#86868B]', label: 'Offline' },
    busy: { color: 'bg-[#FF3B30]', bgColor: 'bg-[#FF3B30]/10', textColor: 'text-[#FF3B30]', label: 'Busy' },
    away: { color: 'bg-[#FF9500]', bgColor: 'bg-[#FF9500]/10', textColor: 'text-[#FF9500]', label: 'Away' },
  }
  
  const config = statusConfig[status]
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        {status === 'online' && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)} />
      </span>
      {label || config.label}
    </div>
  )
}

export { Badge, badgeVariants, StatusBadge }
