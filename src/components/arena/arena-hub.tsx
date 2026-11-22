"use client";

import {
  Bug,
  ClipboardCheck,
  Flame,
  Sparkles,
  Swords,
  Terminal,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { ArenaLeaderboard } from "@/components/arena/arena-leaderboard";
import { CodeChallengeGame } from "@/components/arena/code-challenge-game";
import { FactOrCapGame } from "@/components/arena/fact-or-cap-game";
import { FlashBlitzLobby } from "@/components/arena/flash-blitz-lobby";
import { ScheduledExamsPanel } from "@/components/arena/scheduled-exams-panel";
import { cn } from "@/lib/utils";
import type { ArenaBootstrapData } from "@/types/arena";

type ArenaModeId =
  | "fact_or_cap"
  | "output_rush"
  | "debug_duel"
  | "flash_blitz"
  | "exams";

const ARENA_MODES: ReadonlyArray<{
  id: ArenaModeId;
  labelAr: string;
  subtitleAr: string;
  icon: typeof Zap;
}> = [
  {
    id: "fact_or_cap",
    labelAr: "حقيقة ولا هبد",
    subtitleAr: "10 ثوانٍ لكل عبارة",
    icon: Flame,
  },
  {
    id: "output_rush",
    labelAr: "Output Rush",
    subtitleAr: "توقّع مخرج الكود",
    icon: Terminal,
  },
  {
    id: "debug_duel",
    labelAr: "Debug Duel",
    subtitleAr: "اكشف وأصلح الخطأ",
    icon: Bug,
  },
  {
    id: "flash_blitz",
    labelAr: "1v1 Flash Blitz",
    subtitleAr: "مبارزة ثنائية حية",
    icon: Swords,
  },
  {
    id: "exams",
    labelAr: "الامتحانات المجدولة",
    subtitleAr: "اختبارات أسبوعية وشهرية",
    icon: ClipboardCheck,
  },
] as const;

interface ArenaHubProps {
  initialData: ArenaBootstrapData;
}

export function ArenaHub({ initialData }: ArenaHubProps) {
  const [activeMode, setActiveMode] = useState<ArenaModeId>("fact_or_cap");
  const [sessionXpDelta, setSessionXpDelta] = useState(0);

  const handleEarnXp = (delta: number) => {
    if (delta > 0) {
      setSessionXpDelta((prev) => prev + delta);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-pink/45 bg-cyber-pink/15 px-3 py-1 text-xs font-extrabold text-pink-200">
            <Swords className="h-3.5 w-3.5 text-cyber-pink" />
            ساحة التحديات والبطولات
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            نافس أبطال دفعتك واجمع نقاط XP
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            تحديات سريعة في النظري وتوقع الكود وإصلاح الأخطاء مع لوحة شرف منفصلة لكل صف.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start rounded-2xl border border-cyber-cyan/35 bg-obsidian-elevated/90 px-4 py-2.5 sm:self-auto">
          <Sparkles className="h-4 w-4 text-cyber-cyan" />
          <span className="text-xs font-bold text-slate-muted">مكسب الجلسة:</span>
          <span
            data-testid="arena-session-xp"
            className="tabular-nums-ltr font-mono text-sm font-extrabold text-cyan-200"
          >
            +{sessionXpDelta} XP
          </span>
        </div>
      </header>

      {/* Mode Switcher Cards */}
      <div
        role="tablist"
        aria-label="أوضاع ساحة التحديات"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
      >
        {ARENA_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                isActive
                  ? "border-cyber-cyan/70 bg-gradient-to-bl from-cyber-cyan/15 via-obsidian-elevated to-cyber-purple/15 shadow-neon-cyan"
                  : "border-white/10 bg-obsidian-elevated/75 hover:border-cyber-purple/45",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-cyber-cyan" : "text-cyber-purple",
                  )}
                />
                <span className="text-xs font-extrabold text-white sm:text-sm">
                  {mode.labelAr}
                </span>
              </div>
              <span className="text-[11px] text-slate-muted">
                {mode.subtitleAr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Stage: Active Arena (8 cols) + Leaderboard (4 cols) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {activeMode === "fact_or_cap" ? (
            <FactOrCapGame
              questions={initialData.factOrCapQuestions}
              onEarnXp={handleEarnXp}
            />
          ) : null}

          {activeMode === "output_rush" ? (
            <CodeChallengeGame
              mode="output_rush"
              questions={initialData.outputRushQuestions}
              onEarnXp={handleEarnXp}
            />
          ) : null}

          {activeMode === "debug_duel" ? (
            <CodeChallengeGame
              mode="debug_duel"
              questions={initialData.debugDuelQuestions}
              onEarnXp={handleEarnXp}
            />
          ) : null}

          {activeMode === "flash_blitz" ? (
            <FlashBlitzLobby
              pool={initialData.flashBlitzPool}
              currentUser={initialData.currentUser}
              realtimeConfigured={initialData.realtimeConfigured}
              onEarnXp={handleEarnXp}
            />
          ) : null}

          {activeMode === "exams" ? (
            <ScheduledExamsPanel
              exams={initialData.scheduledExams}
              defaultGrade={initialData.currentUser.grade}
              onEarnXp={handleEarnXp}
            />
          ) : null}
        </div>

        <aside className="xl:col-span-4">
          <ArenaLeaderboard
            leaderboardsByGrade={initialData.leaderboardsByGrade}
            initialGrade={initialData.currentUser.grade}
            sessionXpDelta={sessionXpDelta}
          />
        </aside>
      </div>
    </div>
  );
}
