export default function DashboardLoading() {
  return (
    <div className="flex-1 p-8 animate-pulse space-y-6">
      <div className="h-8 bg-white/5 rounded-xl w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/[0.06]" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded-2xl border border-white/[0.06]" />
    </div>
  );
}
