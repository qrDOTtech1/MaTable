import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  className = "",
}: StatCardProps) {
  const getTrendColor = (direction: "up" | "down" | "neutral") => {
    if (direction === "up") return "text-emerald-400";
    if (direction === "down") return "text-red-400";
    return "text-white/50";
  };

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    if (direction === "up") return "📈";
    if (direction === "down") return "📉";
    return "→";
  };

  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-[#111] p-6 hover:border-white/10 hover:bg-[#141414] transition-all ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <div className={`text-xs font-bold ${getTrendColor(trend.direction)}`}>
            <span className="mr-1">{getTrendIcon(trend.direction)}</span>
            {trend.percentage > 0 ? "+" : ""}{trend.percentage}%
          </div>
        )}
      </div>

      <p className="text-white/50 text-sm font-medium mb-2">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>

      {subtitle && <p className="text-white/30 text-xs mt-3">{subtitle}</p>}
    </div>
  );
}
