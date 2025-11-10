import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/formatters";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function MoneyInput({ 
  value, 
  onChange, 
  onBlur, 
  placeholder = "0.00",
  className = "",
  "data-testid": testId
}: MoneyInputProps) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Display value depends on focus state
  const displayValue = isFocused 
    ? localValue
    : (value > 0 ? value.toFixed(2) : '');
  
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
      <Input
        type="text"
        placeholder={placeholder}
        className={`pl-6 ${className}`}
        value={displayValue}
        onFocus={() => {
          setIsFocused(true);
          setLocalValue(value > 0 ? value.toString() : '');
        }}
        onChange={(e) => {
          const formatted = formatMoney(e.target.value);
          setLocalValue(formatted);
          const numValue = formatted === '' ? 0 : parseFloat(formatted);
          onChange(isNaN(numValue) ? 0 : numValue);
        }}
        onBlur={() => {
          setIsFocused(false);
          setLocalValue('');
          if (value && value > 0) {
            // Ensure proper decimal formatting
            const fixedValue = parseFloat(value.toString()).toFixed(2);
            onChange(parseFloat(fixedValue));
          }
          onBlur?.();
        }}
        data-testid={testId}
      />
    </div>
  );
}
