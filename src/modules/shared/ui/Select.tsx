'use client';

import * as React from 'react';
import { cn } from '@/modules/shared/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  variant?: 'light' | 'dark';
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, children, variant = 'light', ...props }, ref) => {
    // Auto-detect variant based on className
    const isDark = className?.includes('bg-[#F5F5F7]') || className?.includes('bg-white') || variant === 'dark';
    
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-11 w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-[15px] transition-all duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isDark ? [
              // Dark mode styles
              'bg-[#F5F5F7] border-[#E8E8ED] text-[#1D1D1F]',
              'focus:bg-white focus:border-[#007AFF] focus:ring-[#007AFF]/30',
            ] : [
              // Light mode styles
              'bg-[#F5F5F7] border-[#E8E8ED] text-[#1D1D1F]',
              'focus:bg-white focus:border-[#007AFF] focus:ring-[#007AFF]/30',
            ],
            error && 'ring-2 ring-[#FF3B30]/30 border-[#FF3B30]/50 focus:ring-[#FF3B30]/50',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {/* Support both options prop and children */}
          {options ? (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        <ChevronDown className={cn(
          "absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
          isDark ? "text-[#86868B]" : "text-[#86868B]"
        )} />
        {error && (
          <p className="mt-1.5 text-[12px] text-[#FF3B30] font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
