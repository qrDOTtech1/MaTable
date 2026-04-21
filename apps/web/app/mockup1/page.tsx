/**
 * MAQUETTE 1 — Design Minimaliste (inspiré landing)
 * Épuré, beaucoup d'espace blanc, accent orange discret
 * Sidebar gauche, contenu fluide
 */

export default function Mockup1() {
  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col">
        <div className="mb-12">
          <h1 className="text-2xl font-black">A<span className="text-orange-500">table</span>!</h1>
          <p className="text-xs text-white/30 mt-1">Le Comptoir du 7e</p>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { icon: "🔴", label: "Cuisine en direct", active: true },
            { icon: "📊", label: "Analytics", active: false },
            { icon: "📋", label: "Commandes", active: false },
            { icon: "🍽️", label: "Menu", active: false },
            { icon: "👥", label: "Serveurs", active: false },
            { icon: "📅", label: "Réservations", active: false },
            { icon: "⚙️", label: "Paramètres", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm flex items-center gap-3 ${
                item.active
                  ? "bg-orange-500/10 border border-orange-500/30 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/[0.06]">
          <button className="w-full px-4 py-3 text-sm text-white/50 hover:text-white/70 transition-colors text-left">
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 h-16 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-8 flex items-center justify-between z-40">
          <div>
            <h2 className="text-lg font-bold">Cuisine en direct</h2>
            <p className="text-xs text-white/40">Service du midi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              En direct
            </div>
            <div className="text-sm text-white/40">12:34</div>
          </div>
        </div>

        {/* Commandes Grid */}
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-4">PENDING · 4 commandes</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { table: "T.3", name: "Burger Black Angus", mod: "Saignant, sans oignons", time: "12:34" },
                { table: "T.7", name: "Risotto Parmesan", mod: "Vegan ✓", time: "12:36" },
                { table: "T.1", name: "Tartare de bœuf", mod: "Extra câpres", time: "12:41" },
                { table: "T.9", name: "Salade César", mod: "Poulet grillé", time: "12:45" },
              ].map((cmd, i) => (
                <div key={i} className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 hover:border-yellow-500/40 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-yellow-400">{cmd.table}</div>
                      <div className="text-xs text-white/40">{cmd.time}</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">PENDING</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-white text-sm">{cmd.name}</div>
                    <div className="text-xs text-white/50">{cmd.mod}</div>
                  </div>
                  <button className="mt-4 w-full py-2 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 rounded-lg text-xs font-bold text-orange-400 transition-all">
                    Démarrer →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-4">COOKING · 3 commandes</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { table: "T.5", name: "Côte de bœuf 400g", mod: "", time: "12:15", progress: 75 },
                { table: "T.2", name: "Pâtes Carbonara", mod: "Sans œufs", time: "12:20", progress: 50 },
                { table: "T.8", name: "Poisson du jour", mod: "Citron frais", time: "12:25", progress: 30 },
              ].map((cmd, i) => (
                <div key={i} className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 hover:border-orange-500/40 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-orange-400">{cmd.table}</div>
                      <div className="text-xs text-white/40">{cmd.time}</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] font-bold">EN COURS</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="font-semibold text-white text-sm">{cmd.name}</div>
                    <div className="text-xs text-white/50">{cmd.mod}</div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${cmd.progress}%` }} />
                  </div>
                  <button className="mt-4 w-full py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 transition-all">
                    Servir ✓
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-4">SERVED · 6 commandes</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { table: "T.4", name: "Burger Classic", time: "11:50" },
                { table: "T.6", name: "Salade Niçoise", time: "11:55" },
              ].map((cmd, i) => (
                <div key={i} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 opacity-75">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-emerald-400">{cmd.table}</div>
                      <div className="text-xs text-white/40">{cmd.time}</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">SERVI</span>
                  </div>
                  <div className="font-semibold text-white text-sm">{cmd.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
