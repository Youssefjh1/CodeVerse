"use client";

import { Code2, Coins, Flame, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ShellControls } from "@/components/layout/shell-controls";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import type { PlayerShellData } from "@/types/gamification";

interface MobileHudProps {
  data: PlayerShellData;
}

export function MobileHud({ data }: MobileHudProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, mode } = data;

  return (
    <header className="sticky top-0 z-30 border-b border-cyber-purple/20 bg-obsidian-elevated/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyber-purple to-cyber-cyan text-white">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-chalk">
              Code<span className="text-cyber-cyan">Verse</span>
            </span>
            <span className="mr-2 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
              {GRADE_LABELS[profile.grade]}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="tabular-nums-ltr flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono font-bold text-amber-300">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            {profile.coins}
          </span>
          <span className="tabular-nums-ltr flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono font-bold text-pink-300">
            <Flame className="h-3.5 w-3.5 text-cyber-pink" />
            {profile.streak}
          </span>
          {profile.role === "admin" ? (
            <Link
              href="/admin"
              aria-label="لوحة الإدارة"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-cyber-purple/40 bg-cyber-purple/15 text-purple-200"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="خيارات الحساب والصف"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-chalk transition hover:border-cyber-cyan/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
          >
            {menuOpen ? <X className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Slim live XP progress line */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-purple-200">
          {profile.rank.current.titleAr}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-cyber-cyan to-cyber-purple"
            style={{ width: `${profile.rank.progressPercent}%` }}
          />
        </div>
        <span className="tabular-nums-ltr font-mono text-[11px] text-slate-muted">
          {profile.xp} XP
        </span>
      </div>

      {menuOpen ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <ShellControls
            mode={mode}
            profile={profile}
            onActionDone={() => setMenuOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
