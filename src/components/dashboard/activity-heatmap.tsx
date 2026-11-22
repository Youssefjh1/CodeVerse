"use client";

import { CalendarDays, Flame } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { HeatmapDay } from "@/types/gamification";

interface ActivityHeatmapProps {
  days: HeatmapDay[];
  currentStreak: number;
}

const INTENSITY_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "border-white/10 bg-white/[0.04] hover:border-white/30",
  1: "border-cyber-purple/35 bg-cyber-purple/25 hover:border-cyber-purple",
  2: "border-cyber-purple/60 bg-cyber-purple/55 hover:border-cyber-cyan",
  3: "border-cyber-cyan/65 bg-cyber-cyan/60 hover:border-cyan-200",
  4: "border-cyan-300 bg-cyber-cyan shadow-[0_0_12px_rgba(6,182,212,0.55)]",
};

export function ActivityHeatmap({ days, currentStreak }: ActivityHeatmapProps) {
  const defaultDay = days[days.length - 1] ?? null;
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(defaultDay);

  const totalXp = days.reduce((acc, day) => acc + day.xpEarned, 0);
  const activeDaysCount = days.filter((day) => day.intensityLevel > 0).length;

  return (
    <GlassCard className="flex h-full flex-col justify-between p-5 sm:p-6">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-chalk">
              <CalendarDays className="h-5 w-5 text-cyber-cyan" />
              خريطة الالتزام الأسبوعية
            </h2>
            <p className="mt-0.5 text-xs text-slate-muted">
              آخر 16 أسبوع من التحديات والدروس اليومية
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-cyber-pink/40 bg-cyber-pink/15 px-3 py-1 font-bold text-pink-200">
              <Flame className="ml-1 inline h-3.5 w-3.5 text-cyber-pink" />
              <span className="tabular-nums-ltr font-mono">{currentStreak}</span> يوم
              متواصل
            </span>
          </div>
        </div>

        {/* 16 weeks x 7 days grid */}
        <div className="overflow-x-auto pb-2">
          <div
            className="grid min-w-[440px] grid-flow-col grid-rows-7 gap-1.5"
            dir="ltr"
            aria-label="شبكة نشاط المذاكرة خلال 112 يوماً"
          >
            {days.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  data-testid="heatmap-day"
                  aria-label={`${day.labelAr} - ${day.xpEarned} XP`}
                  onMouseEnter={() => setSelectedDay(day)}
                  onFocus={() => setSelectedDay(day)}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "h-4 w-4 rounded-[4px] border transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                    INTENSITY_CLASSES[day.intensityLevel],
                    isSelected && "scale-110 ring-1 ring-white/80",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Day Telemetry & Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
        <div
          data-testid="heatmap-tooltip"
          className="flex flex-wrap items-center gap-2 text-chalk"
        >
          {selectedDay ? (
            <>
              <span className="font-bold text-cyan-200">{selectedDay.labelAr}</span>
              <span className="text-slate-muted">|</span>
              <span className="tabular-nums-ltr font-mono font-bold text-purple-200">
                {selectedDay.xpEarned} XP
              </span>
              <span className="text-slate-muted">
                ({selectedDay.lessonsCompleted} دروس و {selectedDay.challengesSolved} تحديات)
              </span>
            </>
          ) : (
            <span className="text-slate-muted">مرر على أي يوم لعرض التفاصيل</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-muted">
          <span>نشط في {activeDaysCount} يوم</span>
          <span className="tabular-nums-ltr font-mono text-chalk">
            {totalXp.toLocaleString("en-US")} XP
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <span>أقل</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <span
                key={lvl}
                className={cn("h-2.5 w-2.5 rounded-[2px] border", INTENSITY_CLASSES[lvl])}
              />
            ))}
            <span>أعلى</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
