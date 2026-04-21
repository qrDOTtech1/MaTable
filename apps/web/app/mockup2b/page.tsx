"use client";

/**
 * MOCKUP 2B — Design OS Style (Sidebar navigation verticale)
 * Navagation par sidebar à gauche avec émojis
 * Full experience, comme une desktop app (Alternative à 2A)
 */

import { useState } from "react";

export default function Mockup2B() {
  const [activeTab, setActiveTab] = useState("live");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isDark = theme === "dark";
  const bgPrimary = isDark ? "bg-[#0a0a0a]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#111]" : "bg-slate-50";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-white/50" : "text-slate-600";
  const border = isDark ? "border-white/[0.06]" : "border-slate-200";

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: "4" },
    { id: "stats", icon: "📊", label: "Statistiques", badge: null },
    { id: "commandes", icon: "📋", label: "Commandes", badge: "13" },
    { id: "menu", icon: "🍽️", label: "Menu", badge: null },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: "3" },
    { id: "reservations", icon: "📅", label: "Réservations", badge: "2" },
  ];

  return (
    <div className={`min-h-screen ${bgPrimary} ${textPrimary} flex`}>
      {/* Left Sidebar Navigation */}
      <aside className={`w-72 border-r ${border} ${isDark ? "bg-[#0a0a0a]" : "bg-white"} flex flex-col p-6 sticky top-0 h-screen overflow-y-auto`}>
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-black">A<span className="text-orange-500">table</span>!</h1>
          <p className={`text-xs ${textSecondary} mt-1`}>Restaurant Dashboard</p>
        </div>

        {/* Restaurant Info */}
        <div className={`${isDark ? "bg-orange-500/5 border border-orange-500/20" : "bg-orange-50 border border-orange-200"} rounded-xl p-4 mb-8`}>
          <h2 className="font-bold text-sm mb-1">Le Comptoir du 7e</h2>
          <p className={`text-xs ${textSecondary}`}>Service du midi</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">En ligne</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-left ${
                activeTab === tab.id
                  ? `${isDark ? "bg-orange-500/10 border border-orange-500/30 text-orange-400" : "bg-orange-100 border border-orange-300 text-orange-700"}`
                  : `${isDark ? "text-white/50 hover:text-white/70" : "text-slate-600 hover:text-slate-900"}`
              }`}
            >
              <span className="text-lg flex-shrink-0">{tab.icon}</span>
              <span className="flex-1">{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-200 text-orange-700"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className={`border-t ${border} my-6`} />

        {/* Settings Section */}
        <div className="space-y-2">
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isDark ? "text-white/50 hover:text-white/70" : "text-slate-600 hover:text-slate-900"}`}>
            <span className="text-lg">⚙️</span>
            <span>Paramètres</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${isDark ? "text-white/50 hover:text-white/70" : "text-slate-600 hover:text-slate-900"}`}>
            <span className="text-lg">💬</span>
            <span>Témoignage</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm text-orange-500 hover:text-orange-400 font-medium">
            <span className="text-lg">🌐</span>
            <span>Voir ma page</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <div className={`border-t ${border} mt-6 pt-6`}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              isDark
                ? "bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                : "bg-slate-200 border border-slate-300 text-slate-900 hover:bg-slate-300"
            }`}
          >
            <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`h-16 border-b ${border} ${isDark ? "bg-[#0a0a0a]/90" : "bg-white/90"} backdrop-blur-xl px-8 flex items-center justify-between`}>
          <div>
            <h2 className="text-lg font-bold">{tabs.find((t) => t.id === activeTab)?.label}</h2>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-mono ${textSecondary}`}>{new Date().toLocaleTimeString("fr-FR")}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === "live" && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "En attente", value: "4", icon: "⏳", color: "yellow" },
                  { label: "En cours", value: "3", icon: "👨‍🍳", color: "orange" },
                  { label: "Servis", value: "6", icon: "✅", color: "emerald" },
                  { label: "Erreurs", value: "0", icon: "❌", color: "red" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                      stat.color === "yellow"
                        ? isDark
                          ? "border-yellow-500/20 bg-yellow-500/5"
                          : "border-yellow-300 bg-yellow-50"
                        : stat.color === "orange"
                          ? isDark
                            ? "border-orange-500/20 bg-orange-500/5"
                            : "border-orange-300 bg-orange-50"
                          : stat.color === "emerald"
                            ? isDark
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : "border-emerald-300 bg-emerald-50"
                            : isDark
                              ? "border-red-500/20 bg-red-500/5"
                              : "border-red-300 bg-red-50"
                    }`}
                  >
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                      <span>{stat.icon}</span>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Kanban */}
              <div className="grid grid-cols-3 gap-6">
                {/* PENDING */}
                <div>
                  <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${isDark ? "border-yellow-500/20" : "border-yellow-300"}`}>
                    <span className="text-lg">⏳</span>
                    <h3 className="font-bold">PENDING</h3>
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded ${isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-200 text-yellow-700"}`}>4</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { table: "T.3", name: "Burger Black Angus", mod: "Saignant, sans oignons", time: "12:34", emoji: "🍔" },
                      { table: "T.7", name: "Risotto Parmesan", mod: "Vegan ✓", time: "12:36", emoji: "🍚" },
                      { table: "T.1", name: "Tartare de bœuf", mod: "Extra câpres", time: "12:41", emoji: "🥩" },
                      { table: "T.9", name: "Salade César", mod: "Poulet grillé", time: "12:45", emoji: "🥗" },
                    ].map((cmd, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 transition-all cursor-move group ${isDark ? "border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10" : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`font-bold text-sm ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
                          <span className="text-lg group-hover:scale-110 transition-transform">{cmd.emoji}</span>
                        </div>
                        <div className="text-sm font-semibold mb-1">{cmd.name}</div>
                        <div className={`text-xs ${textSecondary} mb-3`}>{cmd.mod}</div>
                        <button className="w-full py-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold rounded-lg transition-all">
                          Démarrer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COOKING */}
                <div>
                  <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${isDark ? "border-orange-500/20" : "border-orange-300"}`}>
                    <span className="text-lg">👨‍🍳</span>
                    <h3 className="font-bold">COOKING</h3>
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded ${isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-200 text-orange-700"}`}>3</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { table: "T.5", name: "Côte de bœuf 400g", mod: "Bien cuit", time: "12:15", progress: 75, emoji: "🥩" },
                      { table: "T.2", name: "Pâtes Carbonara", mod: "Sans œufs", time: "12:20", progress: 50, emoji: "🍝" },
                      { table: "T.8", name: "Poisson du jour", mod: "Citron frais", time: "12:25", progress: 30, emoji: "🐟" },
                    ].map((cmd, i) => (
                      <div key={i} className={`rounded-xl border p-4 ${isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-300 bg-orange-50"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`font-bold text-sm ${isDark ? "text-orange-400" : "text-orange-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
                          <span className="text-lg">{cmd.emoji}</span>
                        </div>
                        <div className="text-sm font-semibold mb-1">{cmd.name}</div>
                        <div className={`text-xs ${textSecondary} mb-2`}>{cmd.mod}</div>
                        <div className={`w-full h-1.5 rounded-full ${isDark ? "bg-white/5" : "bg-slate-300"} overflow-hidden mb-3`}>
                          <div className="h-full bg-orange-500" style={{ width: `${cmd.progress}%` }} />
                        </div>
                        <button className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${isDark ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-200 border border-emerald-300 text-emerald-700 hover:bg-emerald-300"}`}>
                          Servir ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SERVED */}
                <div>
                  <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${isDark ? "border-emerald-500/20" : "border-emerald-300"}`}>
                    <span className="text-lg">✅</span>
                    <h3 className="font-bold">SERVED</h3>
                    <span className={`ml-auto text-xs font-bold px-2 py-1 rounded ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-200 text-emerald-700"}`}>6</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { table: "T.4", name: "Burger Classic", time: "11:50", emoji: "🍔" },
                      { table: "T.6", name: "Salade Niçoise", time: "11:55", emoji: "🥗" },
                      { table: "T.10", name: "Soupe à l'oignon", time: "11:40", emoji: "🍲" },
                      { table: "T.11", name: "Crème brûlée", time: "11:45", emoji: "🍮" },
                      { table: "T.12", name: "Café espresso", time: "11:48", emoji: "☕" },
                      { table: "T.13", name: "Verre de vin", time: "11:52", emoji: "🍷" },
                    ].map((cmd, i) => (
                      <div key={i} className={`rounded-xl border p-4 opacity-75 ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50"}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`font-bold text-sm ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
                          <span className="text-lg">{cmd.emoji}</span>
                        </div>
                        <div className="text-sm font-semibold">{cmd.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "live" && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">
                {tabs.find((t) => t.id === activeTab)?.icon}
              </div>
              <h2 className="text-3xl font-bold mb-2">{tabs.find((t) => t.id === activeTab)?.label}</h2>
              <p className={textSecondary}>Contenu à venir...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
