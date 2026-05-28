"use client";
import Link from "next/link";

export type BottomNavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: number;
};

/**
 * Barre de navigation mobile fixée en bas (visible uniquement < lg).
 * 4 destinations + un onglet "Plus" qui ouvre le drawer existant.
 */
export function MobileBottomNav({
  items,
  pathname,
  onMore,
}: {
  items: BottomNavItem[];
  pathname: string;
  onMore: () => void;
}) {
  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl flex pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
              active ? "text-orange-400" : "text-white/45 hover:text-white/70"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="text-lg leading-none relative">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </span>
            <span className="truncate max-w-full px-0.5">{item.label}</span>
            {active && <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-orange-400" />}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-white/45 hover:text-white/70 transition-colors"
        aria-label="Plus de menus"
      >
        <span className="text-lg leading-none">☰</span>
        <span>Plus</span>
      </button>
    </nav>
  );
}
