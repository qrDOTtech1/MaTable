import { ReactNode } from "react";

interface KanbanColumnProps {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
  color?: "yellow" | "orange" | "emerald";
  className?: string;
}

export function KanbanColumn({
  title,
  icon,
  count,
  children,
  color = "orange",
  className = "",
}: KanbanColumnProps) {
  const colorClasses = {
    yellow: {
      bg: "bg-yellow-500/5",
      border: "border-yellow-500/20",
      badge: "bg-yellow-500/20 text-yellow-400",
    },
    orange: {
      bg: "bg-orange-500/5",
      border: "border-orange-500/20",
      badge: "bg-orange-500/20 text-orange-400",
    },
    emerald: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/20 text-emerald-400",
    },
  };

  const config = colorClasses[color];

  return (
    <div className={`flex flex-col h-full rounded-xl border ${config.bg} ${config.border} p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-white font-bold">{title}</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.badge}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Orders Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {count === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30">
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
