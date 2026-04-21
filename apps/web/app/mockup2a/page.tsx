"use client";

/**
 * MOCKUP 2A — Design OS Style (Tabs horizontaux en haut)
 * Navigation par tabs/onglets en haut
 * Full experience, comme une desktop app
 */

import { useState } from "react";

export default function Mockup2A() {
  const [activeTab, setActiveTab] = useState("live");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isDark = theme === "dark";
  const bgPrimary = isDark ? "bg-[#0a0a0a]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#111]" : "bg-slate-50";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-white/50" : "text-slate-600";
  const border = isDark ? "border-white/[0.06]" : "border-slate-200";
  const accentBg = isDark ? "bg-orange-500/10" : "bg-orange-100";
  const accentBorder = isDark ? "border-orange-500/30" : "border-orange-300";

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: "4" },
    { id: "stats", icon: "📊", label: "Statistiques", badge: null },
    { id: "commandes", icon: "📋", label: "Commandes", badge: "13" },
    { id: "menu", icon: "🍽️", label: "Menu", badge: null },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: "3" },
    { id: "reservations", icon: "📅", label: "Réservations", badge: "2" },
  ];

  return (
    <div className={`min-h-screen ${bgPrimary} ${textPrimary} flex flex-col`}>
      {/* Top Bar - Système */}
      <div className={`h-16 border-b ${border} ${isDark ? "bg-[#0a0a0a]/90" : "bg-white/90"} backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black">A<span className="text-orange-500">table</span>!</h1>
          <span className={`text-sm ${textSecondary}`}>Le Comptoir du 7e</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textSecondary}`}>Service du midi</span>
            <span className={isDark ? "text-white/20" : "text-slate-300"}>•</span>
            <span className={`text-sm font-mono ${textPrimary}`}>{new Date().toLocaleTimeString("fr-FR")}</span>
          </div>

          {/* Theme Switch */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              isDark
                ? "bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20"
                : "bg-slate-200 border border-slate-300 hover:bg-slate-300"
            }`}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`border-b ${border} ${isDark ? "bg-[#0a0a0a]" : "bg-slate-50"} px-8 sticky top-16 z-40`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? `border-orange-500 ${isDark ? "text-orange-400" : "text-orange-600"}`
                  : `border-transparent ${textSecondary} hover:${isDark ? "text-white/70" : "text-slate-700"}`
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-200 text-orange-700"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className={`flex-1 overflow-auto p-8`}>
        {activeTab === "live" && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Cuisine en direct</h2>

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
                    className={`rounded-xl border ${isDark ? `${stat.color === "yellow" ? "border-yellow-500/20 bg-yellow-500/5" : stat.color === "orange" ? "border-orange-500/20 bg-orange-500/5" : stat.color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}` : `${stat.color === "yellow" ? "border-yellow-300 bg-yellow-50" : stat.color === "orange" ? "border-orange-300 bg-orange-50" : stat.color === "emerald" ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`} p-4`}
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
                      { table: "T.3", name: "Burger Black Angus", mod: "Saignant, sans oignons", time: "12:34" },
                      { table: "T.7", name: "Risotto Parmesan", mod: "Vegan ✓", time: "12:36" },
                    ].map((cmd, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border ${isDark ? "border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10" : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"} p-4 transition-all cursor-move`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className={`font-bold ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
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
                      { table: "T.5", name: "Côte de bœuf 400g", mod: "Bien cuit", time: "12:15", progress: 75 },
                      { table: "T.2", name: "Pâtes Carbonara", mod: "Sans œufs", time: "12:20", progress: 50 },
                    ].map((cmd, i) => (
                      <div key={i} className={`rounded-xl border ${isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-300 bg-orange-50"} p-4`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className={`font-bold ${isDark ? "text-orange-400" : "text-orange-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold mb-1">{cmd.name}</div>
                        <div className={`text-xs ${textSecondary} mb-2`}>{cmd.mod}</div>
                        <div className={`w-full h-1.5 rounded-full ${isDark ? "bg-white/5" : "bg-slate-300"} overflow-hidden mb-3`}>
                          <div className="h-full bg-orange-500" style={{ width: `${cmd.progress}%` }} />
                        </div>
                        <button className={`w-full py-2 ${isDark ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-200 border border-emerald-300 text-emerald-700 hover:bg-emerald-300"} text-xs font-bold rounded-lg transition-all`}>
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
                      { table: "T.4", name: "Burger Classic", time: "11:50" },
                      { table: "T.6", name: "Salade Niçoise", time: "11:55" },
                    ].map((cmd, i) => (
                      <div key={i} className={`rounded-xl border ${isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50"} p-4 opacity-75`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{cmd.table}</div>
                            <div className={`text-xs ${textSecondary}`}>{cmd.time}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold">{cmd.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-3xl font-bold mb-2">Statistiques</h2>
            <p className={textSecondary}>Contenu à venir...</p>
          </div>
        )}

        {activeTab === "commandes" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-3xl font-bold mb-2">Historique Commandes</h2>
            <p className={textSecondary}>Vue détaillée de toutes les commandes...</p>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-3xl font-bold mb-2">Gestion Menu</h2>
            <p className={textSecondary}>Ajout/édition des plats...</p>
          </div>
        )}

        {activeTab === "serveurs" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-3xl font-bold mb-2">Gestion Équipe</h2>
            <p className={textSecondary}>Serveurs, horaires, performance...</p>
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-3xl font-bold mb-2">Réservations</h2>
            <p className={textSecondary}>Gérer les réservations entrantes...</p>
          </div>
        )}
      </main>
    </div>
  );
}
