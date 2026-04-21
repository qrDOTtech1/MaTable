"use client";

import { ReactNode, useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  icon,
  fullWidth = false,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className="block text-sm font-semibold text-white/70 mb-2">{label}</label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all font-medium text-sm text-left flex items-center justify-between
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/5"}
            ${error ? "border-red-500/50" : "border-white/10 focus:border-orange-500/50"}
            bg-white/5 text-white placeholder-white/30`}
        >
          <span className="flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center gap-2
                  ${value === option.value ? "bg-orange-500/20 text-orange-400" : "text-white/70 hover:bg-white/5"}
                  border-b border-white/[0.06] last:border-b-0`}
              >
                {option.icon && <span>{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
