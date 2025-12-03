'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/modules/shared/utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'เลือก...',
  searchable = false,
  disabled = false,
  error,
  className,
  size = 'default',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search
  const filteredOptions = searchable && search
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
    setSearch('');
  };

  const sizeClasses = {
    sm: 'h-9 text-[13px] px-3',
    default: 'h-11 text-[15px] px-4',
    lg: 'h-12 text-[16px] px-5',
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-xl bg-white border transition-all duration-200 cursor-pointer',
          sizeClasses[size],
          isOpen 
            ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30' 
            : error 
              ? 'border-[#FF3B30] ring-2 ring-[#FF3B30]/30'
              : 'border-[#D2D2D7] hover:border-[#86868B]',
          disabled && 'opacity-50 cursor-not-allowed bg-[#F5F5F7]'
        )}
      >
        <span className={cn(
          'truncate',
          selectedOption ? 'text-[#1D1D1F]' : 'text-[#A1A1A6]'
        )}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            'w-4 h-4 text-[#86868B] transition-transform duration-200 flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-[12px] text-[#FF3B30] font-medium">{error}</p>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-[#E8E8ED] shadow-lg shadow-black/10 overflow-hidden"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-[#F5F5F7]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="ค้นหา..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F5F5F7] text-[14px] text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-[280px] overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[14px] text-[#86868B]">
                  ไม่พบรายการ
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                      option.value === value 
                        ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                        : 'text-[#1D1D1F] hover:bg-[#F5F5F7]',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[14px] font-medium truncate',
                        option.value === value ? 'text-[#007AFF]' : 'text-[#1D1D1F]'
                      )}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-[12px] text-[#86868B] truncate">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Multi-select Dropdown
export interface MultiDropdownProps {
  options: DropdownOption[];
  value: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  maxDisplay?: number;
}

export function MultiDropdown({
  options,
  value = [],
  onChange,
  placeholder = 'เลือก...',
  searchable = false,
  disabled = false,
  error,
  className,
  maxDisplay = 3,
}: MultiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const filteredOptions = searchable && search
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full min-h-[44px] flex items-center justify-between rounded-xl bg-white border px-4 py-2 transition-all duration-200 cursor-pointer',
          isOpen 
            ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30' 
            : error 
              ? 'border-[#FF3B30] ring-2 ring-[#FF3B30]/30'
              : 'border-[#D2D2D7] hover:border-[#86868B]',
          disabled && 'opacity-50 cursor-not-allowed bg-[#F5F5F7]'
        )}
      >
        <div className="flex-1 flex flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-[15px] text-[#A1A1A6]">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map(opt => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#007AFF]/10 text-[#007AFF] rounded-md text-[13px] font-medium"
                >
                  {opt.label}
                </span>
              ))}
              {selectedOptions.length > maxDisplay && (
                <span className="inline-flex items-center px-2 py-0.5 bg-[#F5F5F7] text-[#86868B] rounded-md text-[13px]">
                  +{selectedOptions.length - maxDisplay}
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown 
          className={cn(
            'w-4 h-4 text-[#86868B] transition-transform duration-200 flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {error && (
        <p className="mt-1.5 text-[12px] text-[#FF3B30] font-medium">{error}</p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-[#E8E8ED] shadow-lg shadow-black/10 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-[#F5F5F7]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="ค้นหา..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F5F5F7] text-[14px] text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30"
                  />
                </div>
              </div>
            )}

            <div className="max-h-[280px] overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[14px] text-[#86868B]">
                  ไม่พบรายการ
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
                        isSelected 
                          ? 'bg-[#007AFF]/10' 
                          : 'hover:bg-[#F5F5F7]',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                        isSelected 
                          ? 'bg-[#007AFF] border-[#007AFF]' 
                          : 'border-[#D2D2D7]'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-[#1D1D1F]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#1D1D1F] truncate">
                          {option.label}
                        </p>
                        {option.description && (
                          <p className="text-[12px] text-[#86868B] truncate">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

