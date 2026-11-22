"use client";

import { motion } from "framer-motion";
import { Coins, Flame, Sparkles, UserCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { StatRadarChart } from "@/components/dashboard/stat-radar-chart";
import { GlassCard } from "@/components/ui/glass-card";
import { updateAvatarFrameAction } from "@/lib/auth/actions";
import { AVATAR_FRAMES, getAvatarFrame } from "@/lib/gamification/frames";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type {
  AvatarFrameId,
  PlayerProfileSummary,
  StatAxis,
} from "@/types/gamification";

interface PlayerStatsCardProps {
  profile: PlayerProfileSummary;
  stats: StatAxis[];
}

export function PlayerStatsCard({ profile, stats }: PlayerStatsCardProps) {
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrameId>(
    profile.avatarFrame,
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeFrame = getAvatarFrame(selectedFrame);

  const handleSelectFrame = (frameId: AvatarFrameId) => {
    const previousFrame = selectedFrame;
    setSelectedFrame(frameId);
    setSaveMessage(null);
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateAvatarFrameAction(frameId);
      if (!result.ok) {
        setSelectedFrame(previousFrame);
        setErrorMessage(result.error ?? "تعذر حفظ إطار الأفاتار.");
        return;
      }
      setSaveMessage("تم تحديث إطار الأفاتار");
    });
  };

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard variant="hero" className="relative overflow-hidden p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cyber-grid bg-[length:28px_28px] opacity-35"
        />

        <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-center">
          {/* Identity, Neon Frame Switcher & Rank Progress */}
          <div className="space-y-5 xl:col-span-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Avatar + Neon Frame */}
              <div className="relative flex shrink-0 items-center justify-center self-start">
                <div
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-2xl font-extrabold text-white transition-all duration-300",
                    activeFrame.ringClass,
                    activeFrame.glowClass,
                  )}
                >
                  <span aria-hidden="true">{initials || "CV"}</span>
                </div>
                <span
                  className="absolute -bottom-2 rounded-full border border-white/15 bg-obsidian px-2.5 py-0.5 text-[11px] font-bold text-cyan-200 shadow-glass"
                  title={activeFrame.nameAr}
                >
                  {activeFrame.nameAr}
                </span>
              </div>

              {/* Player Identity & Badges */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/50 bg-cyber-purple/20 px-3 py-1 text-xs font-extrabold text-purple-100">
                    <Sparkles className="h-3.5 w-3.5 text-cyber-cyan" />
                    {profile.rank.current.titleAr}
                  </span>
                  <span className="rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-3 py-1 text-xs font-bold text-cyan-200">
                    {GRADE_LABELS[profile.grade]}
                  </span>
                  {profile.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyber-pink/45 bg-cyber-pink/15 px-3 py-1 text-xs font-bold text-pink-200">
                      <UserCheck className="h-3.5 w-3.5" />
                      مشرف المنصة
                    </span>
                  ) : null}
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-slate-muted">
                  {profile.rank.current.subtitleAr}
                </p>
              </div>
            </div>

            {/* XP Progress toward Next Rank */}
            <div className="rounded-2xl border border-white/10 bg-obsidian/70 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-chalk">
                  {profile.rank.next
                    ? `التقدم نحو رتبة ${profile.rank.next.titleAr}`
                    : "وصلت إلى القمة المطلقة في CodeVerse"}
                </span>
                <span className="tabular-nums-ltr font-mono font-bold text-cyan-200">
                  {profile.xp.toLocaleString("en-US")} XP
                  {profile.rank.next
                    ? ` / ${profile.rank.next.minXp.toLocaleString("en-US")} XP`
                    : ""}
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-cyber-cyan via-cyber-purple to-cyber-pink transition-all duration-300"
                  style={{ width: `${profile.rank.progressPercent}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="tabular-nums-ltr font-mono">
                      {profile.coins}
                    </span>{" "}
                    عملة
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-pink-300">
                    <Flame className="h-4 w-4 text-cyber-pink" />
                    <span className="tabular-nums-ltr font-mono">
                      {profile.streak}
                    </span>{" "}
                    يوم التزام
                  </span>
                </div>
                {profile.rank.next ? (
                  <span className="text-slate-muted">
                    باقي{" "}
                    <strong className="tabular-nums-ltr font-mono text-chalk">
                      {profile.rank.xpToNext.toLocaleString("en-US")}
                    </strong>{" "}
                    نقطة خبرة للترقية
                  </span>
                ) : null}
              </div>
            </div>

            {/* Avatar Frame Picker */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-muted">
                  إطار النيون:
                </span>
                {AVATAR_FRAMES.map((frame) => {
                  const isPressed = selectedFrame === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      disabled={isPending}
                      aria-pressed={isPressed}
                      onClick={() => handleSelectFrame(frame.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                        isPressed
                          ? "border-cyber-cyan bg-cyber-cyan/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-muted hover:border-white/25 hover:text-chalk",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: frame.swatchHex }}
                      />
                      {frame.nameAr}
                    </button>
                  );
                })}
              </div>
              {errorMessage ? (
                <span role="alert" className="text-xs font-semibold text-pink-300">
                  {errorMessage}
                </span>
              ) : saveMessage ? (
                <span className="text-xs font-semibold text-cyan-300">
                  {saveMessage}
                </span>
              ) : null}
            </div>
          </div>

          {/* 4-Stat SVG Radar + Breakdown */}
          <div className="xl:col-span-5">
            <StatRadarChart stats={stats} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
