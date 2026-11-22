"use client";

import {
  LayoutDashboard,
  PlaySquare,
  ShoppingBag,
  Swords,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PLATFORM_NAV_ITEMS,
  type NavIconName,
} from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";

const MOBILE_ICON_MAP: Record<Exclude<NavIconName, "ShieldCheck">, typeof LayoutDashboard> = {
  LayoutDashboard,
  Terminal,
  Swords,
  PlaySquare,
  ShoppingBag,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const tabs = PLATFORM_NAV_ITEMS.filter((item) => item.mobileTab);

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-cyber-purple/25 bg-obsidian-elevated/95 px-2 py-2 backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon =
            MOBILE_ICON_MAP[tab.iconName as Exclude<NavIconName, "ShieldCheck">];
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition",
                isActive
                  ? "bg-cyber-purple/20 text-cyan-200"
                  : "text-slate-muted hover:text-chalk",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-[64px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
