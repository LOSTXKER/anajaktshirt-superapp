import * as React from "react"
import { cn } from "@/modules/shared/utils/cn"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'primary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - Apple-like
          "relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          
          // Variants
          variant === 'default' && "bg-[#1D1D1F] text-white hover:bg-[#2D2D2F]",
          
          variant === 'primary' && "bg-[#007AFF] text-white hover:bg-[#0066DB]",
          
          variant === 'secondary' && "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]",
          
          variant === 'outline' && "border border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] hover:border-[#86868B]",
          
          variant === 'ghost' && "text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] border border-transparent hover:border-[#E8E8ED]",
          
          variant === 'destructive' && "bg-[#FF3B30] text-white hover:bg-[#E63329]",
          
          // Sizes
          size === 'default' && "h-10 px-5 text-[14px] rounded-xl",
          size === 'sm' && "h-8 px-3.5 text-[13px] rounded-lg",
          size === 'lg' && "h-12 px-7 text-[15px] rounded-xl",
          size === 'icon' && "h-10 w-10 rounded-xl",
          
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
