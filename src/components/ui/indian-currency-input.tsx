"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatIndianNumber, parseIndianNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string | undefined | null;
  onValueChange: (numericValue: number, formattedString: string) => void;
  prefix?: string;
}

export function IndianCurrencyInput({
  value,
  onValueChange,
  prefix = "₹",
  className,
  placeholder = "e.g. 15,00,000",
  ...props
}: Props) {
  const [displayValue, setDisplayValue] = React.useState<string>(() =>
    value ? formatIndianNumber(value) : ""
  );

  React.useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      const formatted = formatIndianNumber(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseIndianNumber(raw);
    const formatted = formatIndianNumber(raw);
    setDisplayValue(formatted);
    onValueChange(numeric, formatted);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-slate-500 font-bold text-sm pointer-events-none select-none z-10">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(prefix ? "pl-8" : "", "font-medium", className)}
        {...props}
      />
    </div>
  );
}
