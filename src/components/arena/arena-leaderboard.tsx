"use client";

import { Crown, Flame, Medal, Trophy } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { ArenaBootstrapData, LeaderboardEntry } from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

interface ArenaLeaderboardProps {
  leaderboardsByGrade: ArenaBootstrapData["leaderboardsByGrade"];
  initialGrade: GradeTier;
  sessionXpDelta: number;
}

export function ArenaLeaderboard({
  leaderboardsByGrade,
  initialGrade,
  sessionXpDelta,
}: ArenaLeaderboardProps) {
  const [selectedGrade, setSelectedGrade] = useState<"grade_10" | "grade_11">(
    initialGrade === "grade_10" ? "grade_10" : "grade_11",
  );
  const [activeTab, setActiveTab] = useState<"weekly" | "season">("weekly");

  const baseList = leaderboardsByGrade[selectedGrade][activeTab];

  const entries: LeaderboardEntry[] = baseList
    .map((entry) => {
      if (!entry.isCurrentUser || sessionXpDelta === 0) return entry;
      return {
        ...entry,
        weeklyXp: entry.weeklyXp + sessionXpDelta,
        seasonXp: entry.seasonXp + sessionXpDelta,
      };
    })
    .sort((a, b) =>
      activeTab === "weekly" ? b.weeklyXp - a.weeklyXp : b.seasonXp - a.seasonXp,
    )
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/45 bg-amber-400/15 text-amber-300">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-chalk">لوحة الشرف</h2>
            <p className="text-[11px] text-slate-muted">
              ترتيب المتفوقين حسب الصف الدراسي
            </p>
          </div>
        </div>
      </div>

      {/* Grade Filter */}
      <div
        role="group"
        aria-label="تصفية الترتيب حسب الصف"
        className="mt-4 grid grid-cols-2 gap-2"
      >
        {(
          [
            { id: "grade_10", label: "أولى ثانوي" },
            { id: "grade_11", label: "تانية ثانوي" },
          ] as const
        ).map((gradeOpt) => (
          <button
            key={gradeOpt.id}
            type="button"
            aria-pressed={selectedGrade === gradeOpt.id}
            onClick={() => setSelectedGrade(gradeOpt.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
              selectedGrade === gradeOpt.id
                ? "border-cyber-cyan/60 bg-cyber-cyan/15 text-cyan-100 shadow-neon-cyan"
                : "border-white/10 bg-obsidian/70 text-slate-muted hover:text-chalk",
            )}
          >
            {gradeOpt.label}
          </button>
        ))}
      </div>

      {/* Weekly vs Season Tabs */}
      <div
        role="tablist"
        aria-label="نطاق لوحة الشرف"
        className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-obsidian p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "weekly"}
          onClick={() => setActiveTab("weekly")}
          className={cn(
            "rounded-lg px-2.5 py-2 text-xs font-bold transition",
            activeTab === "weekly"
              ? "bg-cyber-purple/25 text-purple-100"
              : "text-slate-muted hover:text-chalk",
          )}
        >
          دوري الأسبوع (Weekly Reset)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "season"}
          onClick={() => setActiveTab("season")}
          className={cn(
            "rounded-lg px-2.5 py-2 text-xs font-bold transition",
            activeTab === "season"
              ? "bg-cyber-purple/25 text-purple-100"
              : "text-slate-muted hover:text-chalk",
          )}
        >
          تصنيف الموسم (Season Ranks)
        </button>
      </div>

      {/* Entries */}
      <div data-testid="leaderboard-list" className="mt-4 space-y-2">
        {entries.map((entry) => {
          const displayedXp =
            activeTab === "weekly" ? entry.weeklyXp : entry.seasonXp;
          return (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5",
                entry.isCurrentUser
                  ? "border-cyber-cyan/55 bg-cyber-cyan/15"
                  : entry.rank === 1
                    ? "border-amber-400/40 bg-amber-400/10"
                    : "border-white/10 bg-obsidian/75",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "tabular-nums-ltr flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-extrabold",
                    entry.rank === 1
                      ? "bg-amber-400/20 text-amber-300"
                      : entry.rank <= 3
                        ? "bg-cyber-purple/20 text-purple-200"
                        : "bg-white/5 text-slate-muted",
                  )}
                >
                  {entry.rank === 1 ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : entry.rank <= 3 ? (
                    <Medal className="h-3.5 w-3.5" />
                  ) : (
                    entry.rank
                  )}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-chalk">
                    {entry.fullName}
                    {entry.isCurrentUser ? " (أنت)" : ""}
                  </p>
                  <p className="truncate text-[10px] text-slate-muted">
                    {entry.rankTitleAr}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <span className="tabular-nums-ltr inline-flex items-center gap-0.5 font-mono text-[11px] font-bold text-pink-300">
                  <Flame className="h-3 w-3 text-cyber-pink" />
                  {entry.streak}
                </span>
                <span className="tabular-nums-ltr font-mono text-xs font-extrabold text-cyan-200">
                  {displayedXp.toLocaleString("en-US")} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
