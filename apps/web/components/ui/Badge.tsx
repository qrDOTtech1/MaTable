interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pending" | "cooking" | "served" | "stat";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-white/5 border border-white/10 text-white/70",
    pending: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400",
    cooking: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
    served: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    stat: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
