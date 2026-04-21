/**
 * MAQUETTE 2 — Design Kanban (Colonnes par status)
 * 3 colonnes: PENDING | COOKING | SERVED
 * Plus d'infos visibles, layout plus dense mais clair
 * Top nav, contenu full-width
 */

export default function Mockup2() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Bar */}
      <nav className="h-16 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black">A<span className="text-orange-500">table</span>!</h1>
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/[0.06]">
            <span className="text-sm text-white/50">Le Comptoir du 7e</span>
            <div className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              LIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/50">Service du midi</span>
            <span className="text-white/30">|</span>
            <span className="font-mono text-white">{new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center cursor-pointer hover:bg-orange-500/20 transition-all">
            ⚙️
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "En attente", value: "4", color: "yellow", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
            { label: "En cours", value: "3", color: "orange", bg: "bg-orange-500/5", border: "border-orange-500/20" },
            { label: "Servis", value: "6", color: "emerald", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
            { label: "Erreurs", value: "0", color: "red", bg: "bg-red-500/5", border: "border-red-500/20" },
          ].map((stat, i) => (
            <div key={i} className={`rounded-xl border ${stat.border} ${stat.bg} p-4`}>
              <div className={`text-2xl font-black text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: PENDING */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-yellow-500/20">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <h2 className="font-bold">PENDING</h2>
              <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded font-bold">4</span>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { table: "T.3", name: "Burger Black Angus", mod: "Saignant, sans oignons", time: "12:34", icon: "🍔" },
                { table: "T.7", name: "Risotto Parmesan", mod: "Vegan ✓", time: "12:36", icon: "🍚" },
                { table: "T.1", name: "Tartare de bœuf", mod: "Extra câpres", time: "12:41", icon: "🥩" },
                { table: "T.9", name: "Salade César", mod: "Poulet grillé", time: "12:45", icon: "🥗" },
              ].map((cmd, i) => (
                <div key={i} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 hover:border-yellow-500/40 hover:bg-yellow-500/10 transition-all cursor-move group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-yellow-400 text-sm">{cmd.table}</div>
                      <div className="text-[11px] text-white/40">{cmd.time}</div>
                    </div>
                    <span className="text-xl">{cmd.icon}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{cmd.name}</div>
                  <div className="text-xs text-white/50 mb-3">{cmd.mod}</div>
                  <button className="w-full py-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-lg transition-all">
                    Démarrer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: COOKING */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-orange-500/20">
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
              <h2 className="font-bold">COOKING</h2>
              <span className="ml-auto text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded font-bold">3</span>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { table: "T.5", name: "Côte de bœuf 400g", mod: "Bien cuit", time: "12:15", icon: "🥩", progress: 75 },
                { table: "T.2", name: "Pâtes Carbonara", mod: "Sans œufs", time: "12:20", icon: "🍝", progress: 50 },
                { table: "T.8", name: "Poisson du jour", mod: "Citron frais", time: "12:25", icon: "🐟", progress: 30 },
              ].map((cmd, i) => (
                <div key={i} className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 hover:border-orange-500/40 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-orange-400 text-sm">{cmd.table}</div>
                      <div className="text-[11px] text-white/40">{cmd.time}</div>
                    </div>
                    <span className="text-xl">{cmd.icon}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{cmd.name}</div>
                  <div className="text-xs text-white/50 mb-2">{cmd.mod}</div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${cmd.progress}%` }} />
                  </div>
                  <button className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all">
                    Servir ✓
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: SERVED */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-emerald-500/20">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <h2 className="font-bold">SERVED</h2>
              <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">6</span>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { table: "T.4", name: "Burger Classic", time: "11:50", icon: "🍔" },
                { table: "T.6", name: "Salade Niçoise", time: "11:55", icon: "🥗" },
                { table: "T.10", name: "Soupe à l'oignon", time: "11:40", icon: "🍲" },
                { table: "T.11", name: "Crème brûlée", time: "11:45", icon: "🍮" },
                { table: "T.12", name: "Café espresso", time: "11:48", icon: "☕" },
                { table: "T.13", name: "Verre de vin", time: "11:52", icon: "🍷" },
              ].map((cmd, i) => (
                <div key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 opacity-70">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-emerald-400 text-sm">{cmd.table}</div>
                      <div className="text-[11px] text-white/40">{cmd.time}</div>
                    </div>
                    <span className="text-xl">{cmd.icon}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{cmd.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
