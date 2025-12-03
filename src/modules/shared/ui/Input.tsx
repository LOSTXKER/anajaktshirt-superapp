import * as React from "react"
import { cn } from "@/modules/shared/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl bg-[#F5F5F7] border border-[#E8E8ED] px-4 py-3 text-[15px] text-[#1D1D1F] transition-all duration-200",
            "placeholder:text-[#A1A1A6]",
            "focus:outline-none focus:bg-white focus:ring-2 focus:border-[#007AFF]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-11",
            error
              ? "ring-2 ring-[#FF3B30]/30 border-[#FF3B30]/50 focus:ring-[#FF3B30]/50"
              : "focus:ring-[#007AFF]/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[12px] text-[#FF3B30] font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-xl bg-[#F5F5F7] border border-[#E8E8ED] px-4 py-3 text-[15px] text-[#1D1D1F] transition-all duration-200 resize-none",
            "placeholder:text-[#A1A1A6]",
            "focus:outline-none focus:bg-white focus:ring-2 focus:border-[#007AFF]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "ring-2 ring-[#FF3B30]/30 border-[#FF3B30]/50 focus:ring-[#FF3B30]/50"
              : "focus:ring-[#007AFF]/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[12px] text-[#FF3B30] font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Label component
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[13px] font-medium text-[#1D1D1F] mb-2 block",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-[#FF3B30] ml-0.5">*</span>}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Input, Textarea, Label }
