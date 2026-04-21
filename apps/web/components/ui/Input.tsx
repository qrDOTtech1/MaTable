import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "dark";
}

export function Input({
  label,
  error,
  helpText,
  icon,
  fullWidth = false,
  variant = "default",
  disabled = false,
  ...props
}: InputProps) {
  const baseClasses =
    "px-4 py-2.5 rounded-lg border transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    default:
      "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-orange-500/50 focus:bg-white/10 focus:outline-none",
    dark: "bg-[#0a0a0a] border-white/[0.06] text-white placeholder-white/30 focus:border-orange-500/50 focus:bg-[#111] focus:outline-none",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <div className={widthClass}>
      {label && (
        <label className="block text-sm font-semibold text-white/70 mb-2">{label}</label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
            {icon}
          </div>
        )}
        <input
          {...props}
          disabled={disabled}
          className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${
            icon ? "pl-10" : ""
          } ${error ? "border-red-500/50 focus:border-red-500/50" : ""}`}
        />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-400">{error}</p>}
      {helpText && !error && <p className="mt-2 text-xs text-white/40">{helpText}</p>}
    </div>
  );
}
