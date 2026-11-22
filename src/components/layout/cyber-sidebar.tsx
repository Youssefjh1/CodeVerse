"use client";

import {
  Code2,
  Coins,
  Flame,
  LayoutDashboard,
  PlaySquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Swords,
  Terminal,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PLATFORM_NAV_ITEMS,
  type NavIconName,
} from "@/components/layout/navigation-config";
import { ShellControls } from "@/components/layout/shell-controls";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { PlayerShellData } from "@/types/gamification";

const ICON_MAP: Record<NavIconName, typeof LayoutDashboard> = {
  LayoutDashboard,
  Terminal,
  Swords,
  PlaySquare,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Ticket,
};

interface CyberSidebarProps {
  data: PlayerShellData;
}

export function CyberSidebar({ data }: CyberSidebarProps) {
  const pathname = usePathname();
  const { profile, mode } = data;
  const visibleItems = PLATFORM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || profile.role === "admin",
  );

  return (
    <aside className="hidden w-[272px] shrink-0 flex-col border-l border-cyber-purple/20 bg-obsidian-elevated/95 px-4 py-6 backdrop-blur-xl lg:flex">
      {/* Brand Emblem */}
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition hover:border-cyber-cyan/40"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyber-purple via-indigo-600 to-cyber-cyan text-white shadow-neon-purple">
          <Code2 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-chalk">
            Code<span className="text-cyber-cyan">Verse</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-muted">
            برمجة وعلوم حاسب للثانوية
          </p>
        </div>
      </Link>

      {/* Live Student HUD Mini Card */}
      <div className="mb-6 rounded-2xl border border-cyber-purple/25 bg-obsidian/80 p-3.5 shadow-glass">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-chalk">
            {profile.fullName}
          </span>
          <span className="shrink-0 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
            {GRADE_LABELS[profile.grade]}
          </span>
        </div>

        {/* XP Bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-purple-200">
              {profile.rank.current.titleAr}
            </span>
            <span className="tabular-nums-ltr font-mono text-slate-muted">
              {profile.xp.toLocaleString("en-US")} XP
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={profile.rank.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="تقدم نقاط الخبرة نحو الرتبة التالية"
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-cyber-cyan via-cyber-purple to-cyber-pink transition-all duration-300"
              style={{ width: `${profile.rank.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Coins & Streak */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-slate-muted">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              عملات
            </span>
            <span className="tabular-nums-ltr font-mono font-bold text-amber-300">
              {profile.coins}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-slate-muted">
              <Flame className="h-3.5 w-3.5 text-cyber-pink" />
              التزام
            </span>
            <span className="tabular-nums-ltr font-mono font-bold text-pink-300">
              {profile.streak}d
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="القائمة الرئيسية" className="flex flex-1 flex-col gap-1.5">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                isActive
                  ? "border border-cyber-purple/45 bg-cyber-purple/15 text-white shadow-neon-purple"
                  : "border border-transparent text-slate-muted hover:border-white/10 hover:bg-white/[0.04] hover:text-chalk",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 transition",
                    isActive
                      ? "text-cyber-cyan"
                      : "text-slate-muted group-hover:text-cyber-purple",
                  )}
                />
                {item.label}
              </span>
              {item.phaseTag ? (
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-muted">
                  {item.phaseTag}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Grade switcher & Demo/Account controls */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <ShellControls mode={mode} profile={profile} />
      </div>
    </aside>
  );
}
