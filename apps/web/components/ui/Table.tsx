import { ReactNode } from "react";

interface TableColumn {
  header: string;
  key: string;
  width?: string;
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  empty?: string;
}

export function Table({
  columns,
  data,
  onRowClick,
  loading = false,
  empty = "No data available",
}: TableProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" ") }}>
          {columns.map((col) => (
            <div key={col.key} className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/30">
            <p className="text-sm">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30">
            <p className="text-sm">{empty}</p>
          </div>
        ) : (
          data.map((row, idx) => (
            <div
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/[0.06] px-6 py-4 last:border-b-0 ${
                onRowClick ? "cursor-pointer hover:bg-white/5 transition-colors" : ""
              }`}
            >
              <div className="grid gap-4" style={{ gridTemplateColumns: columns.map((c) => c.width || "1fr").join(" ") }}>
                {columns.map((col) => (
                  <div key={col.key} className="text-sm text-white/70">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
