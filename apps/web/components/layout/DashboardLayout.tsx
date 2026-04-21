"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export interface DashboardTab {
  id: string;
  icon: string;
  label: string;
  badge?: number;
  href?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeTabId: string;
  tabs: DashboardTab[];
  onTabChange?: (tabId: string) => void;
  title?: string;
  restaurantName?: string;
}

export function DashboardLayout({
  children,
  activeTabId,
  tabs,
  onTabChange,
  title,
  restaurantName = "Restaurant",
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isDark = theme === "dark";
  const bgPrimary = isDark ? "bg-[#0a0a0a]" : "bg-white";
  const bgSecondary = isDark ? "bg-[#111]" : "bg-slate-50";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-white/50" : "text-slate-600";
  const border = isDark ? "border-white/[0.06]" : "border-slate-200";

  return (
    <div className={`min-h-screen ${bgPrimary} ${textPrimary} flex flex-col`}>
      {/* Top Bar */}
      <div className={`h-16 border-b ${border} ${isDark ? "bg-[#0a0a0a]/90" : "bg-white/90"} backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black">A<span className="text-orange-500">table</span>!</h1>
          <span className={`text-sm ${textSecondary}`}>{restaurantName}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textSecondary}`}>Service du midi</span>
            <span className={isDark ? "text-white/20" : "text-slate-300"}>•</span>
            <span className={`text-sm font-mono ${textPrimary}`}>{new Date().toLocaleTimeString("fr-FR")}</span>
          </div>

          {/* Theme Toggle */}
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

          <Link
            href="/dashboard/settings"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}
          >
            ⚙️
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`border-b ${border} ${isDark ? "bg-[#0a0a0a]" : "bg-slate-50"} px-8 sticky top-16 z-40`}>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            const handleClick = () => {
              if (tab.href) {
                router.push(tab.href);
              } else if (onTabChange) {
                onTabChange(tab.id);
              }
            };

            return (
              <button
                key={tab.id}
                onClick={handleClick}
                className={`px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? `border-orange-500 ${isDark ? "text-orange-400" : "text-orange-600"}`
                    : `border-transparent ${textSecondary} hover:${isDark ? "text-white/70" : "text-slate-700"}`
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-200 text-orange-700"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className={`flex-1 overflow-auto p-8`}>{children}</main>
    </div>
  );
}
