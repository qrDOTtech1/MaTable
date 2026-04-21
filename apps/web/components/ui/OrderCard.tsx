import { ReactNode } from "react";

export type OrderStatus = "pending" | "cooking" | "served";

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface OrderCardProps {
  id: string;
  tableNumber: number | string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount?: number;
  createdAt?: Date | string;
  eta?: number; // Minutes
  onClick?: () => void;
  onAction?: (action: "move" | "cancel") => void;
  dragHandle?: ReactNode;
  isDragging?: boolean;
  className?: string;
}

export function OrderCard({
  id,
  tableNumber,
  status,
  items,
  totalAmount,
  createdAt,
  eta,
  onClick,
  onAction,
  dragHandle,
  isDragging = false,
  className = "",
}: OrderCardProps) {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-500/5",
      border: "border-yellow-500/20",
      icon: "⏳",
      color: "text-yellow-400",
    },
    cooking: {
      bg: "bg-orange-500/5",
      border: "border-orange-500/20",
      icon: "👨‍🍳",
      color: "text-orange-400",
    },
    served: {
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      icon: "✅",
      color: "text-emerald-400",
    },
  };

  const config = statusConfig[status];

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border transition-all cursor-pointer ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${config.bg} ${config.border} p-4 hover:shadow-md hover:scale-[1.02] ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {dragHandle && <div className="cursor-grab active:cursor-grabbing">{dragHandle}</div>}
          <div>
            <p className={`text-lg font-bold ${config.color}`}>Table {tableNumber}</p>
            {createdAt && <p className="text-white/40 text-xs">{formatTime(createdAt)}</p>}
          </div>
        </div>
        <span className="text-xl">{config.icon}</span>
      </div>

      {/* Items */}
      <div className="mb-3 space-y-1">
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-2">
            <span className="text-white/70 text-sm truncate flex-1">
              {item.quantity}× {item.name}
            </span>
            {item.notes && (
              <span className="text-white/40 text-xs italic whitespace-nowrap">({item.notes})</span>
            )}
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-white/40 text-xs pt-1">+{items.length - 3} more items</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {totalAmount && (
            <span className="font-semibold text-white/80">{(totalAmount / 100).toFixed(2)}€</span>
          )}
          {eta && status === "cooking" && (
            <span className={`${config.color} font-medium`}>~{eta}min</span>
          )}
        </div>
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction(status === "served" ? "cancel" : "move");
            }}
            className="px-2 py-1 rounded text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
          >
            {status === "pending" ? "👨‍🍳" : status === "cooking" ? "✅" : "❌"}
          </button>
        )}
      </div>
    </div>
  );
}
