"use client";

import { ReactNode } from "react";

export interface DashboardTab {
  id: string;
  icon: string;
  label: string;
  badge?: number;
  href?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeTabId?: string;
  tabs?: DashboardTab[];
  onTabChange?: (tabId: string) => void;
  title?: string;
  restaurantName?: string;
}

/**
 * DashboardLayout is now a thin passthrough wrapper.
 * All navigation (top bar + sidebar) is handled by app/dashboard/layout.tsx.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
