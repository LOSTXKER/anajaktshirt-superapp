import * as React from "react"
import { cn } from "@/modules/shared/utils/cn"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-2xl text-[#1D1D1F] transition-all duration-300",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04)]",
        hover && "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[17px] font-semibold leading-tight text-[#1D1D1F]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[13px] text-[#86868B]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Stat Card for metrics - Apple style
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-white",
      blue: "bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] text-white",
      green: "bg-gradient-to-br from-[#34C759] to-[#30D158] text-white",
      orange: "bg-gradient-to-br from-[#FF9500] to-[#FFCC00] text-white",
      red: "bg-gradient-to-br from-[#FF3B30] to-[#FF6961] text-white",
      purple: "bg-gradient-to-br from-[#AF52DE] to-[#BF5AF2] text-white",
    };

    const isColored = variant !== 'default';

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
          variants[variant],
          !isColored && "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04)]",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-[13px] font-medium", isColored ? "text-white/80" : "text-[#86868B]")}>
              {title}
            </p>
            <p className={cn("text-[28px] font-semibold tracking-tight", isColored ? "text-white" : "text-[#1D1D1F]")}>
              {value}
            </p>
            {subtitle && (
              <p className={cn("text-[12px] font-medium", isColored ? "text-white/70" : "text-[#86868B]")}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2.5 rounded-xl [&>svg]:w-5 [&>svg]:h-5",
              isColored ? "bg-white/20 text-white [&>svg]:text-white" : "bg-[#F5F5F7] text-[#1D1D1F] [&>svg]:text-[#1D1D1F]"
            )}>
              {icon}
            </div>
          )}
        </div>
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard }
