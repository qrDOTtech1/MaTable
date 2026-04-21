import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "pending" | "cooking" | "served" | "stat";
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  variant = "default",
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses =
    "rounded-xl border transition-all";

  const variantClasses = {
    default: "border-white/[0.06] bg-[#111] hover:border-white/10 hover:bg-[#141414]",
    pending: "border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10",
    cooking: "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10",
    served: "border-emerald-500/20 bg-emerald-500/5 opacity-75",
    stat: "border-white/[0.06] bg-[#111]",
  };

  const hoverClasses = hover ? "cursor-pointer hover:scale-[1.01]" : "";

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
