'use client';

import * as React from 'react';
import { cn } from '@/modules/shared/utils/cn';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | string;
  onChange: (value: number) => void;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  emptyValue?: number; // Value to use when input is empty (default: 0)
}

/**
 * NumberInput - Input ตัวเลขที่ลบ 0 ได้
 * 
 * @example
 * const [qty, setQty] = useState(0);
 * <NumberInput value={qty} onChange={setQty} min={0} />
 */
export function NumberInput({
  value,
  onChange,
  allowDecimal = false,
  allowNegative = false,
  emptyValue = 0,
  className,
  onBlur,
  ...props
}: NumberInputProps) {
  // Store as string internally to allow empty input
  const [internalValue, setInternalValue] = React.useState<string>(
    value === 0 || value === '' ? '' : String(value)
  );

  // Sync with external value
  React.useEffect(() => {
    // Only update if external value is different from what we'd parse
    const currentNum = internalValue === '' ? emptyValue : parseFloat(internalValue);
    const externalNum = typeof value === 'string' ? parseFloat(value) || emptyValue : value;
    
    if (currentNum !== externalNum) {
      setInternalValue(externalNum === 0 ? '' : String(externalNum));
    }
  }, [value, emptyValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Allow empty
    if (newValue === '') {
      setInternalValue('');
      onChange(emptyValue);
      return;
    }

    // Filter invalid characters
    if (allowDecimal) {
      // Allow digits, one decimal point, and optionally minus
      const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
      if (!regex.test(newValue)) return;
    } else {
      // Allow only digits and optionally minus
      const regex = allowNegative ? /^-?\d*$/ : /^\d*$/;
      if (!regex.test(newValue)) return;
    }

    setInternalValue(newValue);
    
    // Parse and send to parent
    const parsed = allowDecimal ? parseFloat(newValue) : parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Clean up value on blur
    if (internalValue === '' || internalValue === '-') {
      setInternalValue('');
      onChange(emptyValue);
    } else {
      // Format the number properly
      const parsed = allowDecimal ? parseFloat(internalValue) : parseInt(internalValue, 10);
      if (!isNaN(parsed)) {
        setInternalValue(parsed === 0 ? '' : String(parsed));
        onChange(parsed);
      }
    }
    
    onBlur?.(e);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        "w-full h-11 px-4 rounded-xl",
        "bg-white border border-[#D2D2D7]",
        "text-[15px] text-[#1D1D1F] text-center",
        "focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]",
        "placeholder:text-[#86868B]",
        "disabled:bg-[#F5F5F7] disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

/**
 * QuantityInput - Preset สำหรับจำนวนสินค้า (ไม่ติดลบ, ไม่มีทศนิยม)
 */
export function QuantityInput(props: Omit<NumberInputProps, 'allowDecimal' | 'allowNegative'>) {
  return <NumberInput {...props} allowDecimal={false} allowNegative={false} />;
}

/**
 * PriceInput - Preset สำหรับราคา (มีทศนิยม, ไม่ติดลบ)
 */
export function PriceInput(props: Omit<NumberInputProps, 'allowDecimal' | 'allowNegative'>) {
  return <NumberInput {...props} allowDecimal={true} allowNegative={false} />;
}



