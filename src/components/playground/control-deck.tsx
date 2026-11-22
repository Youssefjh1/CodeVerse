"use client";

import {
  Gauge,
  Pause,
  Play,
  RotateCcw,
  StepBack,
  StepForward,
} from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";

export const PLAYBACK_SPEEDS = [
  { label: "0.5x", delayMs: 1400 },
  { label: "1x", delayMs: 850 },
  { label: "2x", delayMs: 420 },
  { label: "4x", delayMs: 180 },
] as const;

interface ControlDeckProps {
  isPlaying: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
  canReset: boolean;
  currentStepNumber: number;
  totalSteps: number;
  speedIndex: number;
  onRunAll: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (nextIndex: number) => void;
}

export function ControlDeck({
  isPlaying,
  canStepBack,
  canStepForward,
  canReset,
  currentStepNumber,
  totalSteps,
  speedIndex,
  onRunAll,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSpeedChange,
}: ControlDeckProps) {
  const speed = PLAYBACK_SPEEDS[speedIndex] ?? PLAYBACK_SPEEDS[1];
  const progressPercent =
    totalSteps > 0 ? Math.min(100, Math.round((currentStepNumber / totalSteps) * 100)) : 0;

  return (
    <GlassCard className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Playback Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isPlaying ? (
            <CyberButton
              variant="cyan"
              size="sm"
              onClick={onPause}
              aria-label="إيقاف مؤقت"
            >
              <Pause className="h-4 w-4" />
              إيقاف مؤقت
            </CyberButton>
          ) : (
            <CyberButton
              variant="primary"
              size="sm"
              onClick={onRunAll}
              aria-label="تشغيل الكل"
            >
              <Play className="h-4 w-4" />
              تشغيل الكل
            </CyberButton>
          )}

          <CyberButton
            variant="cyan"
            size="sm"
            onClick={onStepForward}
            disabled={isPlaying || !canStepForward}
            aria-label="خطوة للأمام"
          >
            <StepForward className="h-4 w-4" />
            خطوة للأمام
          </CyberButton>

          <CyberButton
            variant="ghost"
            size="sm"
            onClick={onStepBack}
            disabled={isPlaying || !canStepBack}
            aria-label="خطوة للخلف"
          >
            <StepBack className="h-4 w-4" />
            خطوة للخلف
          </CyberButton>

          <CyberButton
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!canReset && !isPlaying}
            aria-label="إعادة ضبط"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة ضبط
          </CyberButton>
        </div>

        {/* Speed Slider & Step Counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-obsidian/70 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-muted">
              <Gauge className="h-3.5 w-3.5 text-cyber-cyan" />
              السرعة
            </span>
            <input
              type="range"
              min={0}
              max={PLAYBACK_SPEEDS.length - 1}
              step={1}
              value={speedIndex}
              onChange={(event) => onSpeedChange(Number(event.target.value))}
              aria-label="سرعة التنفيذ"
              className="h-1.5 w-24 cursor-pointer accent-cyber-cyan sm:w-28"
            />
            <span
              data-testid="speed-value"
              className="tabular-nums-ltr min-w-[2.5rem] rounded-md border border-cyber-cyan/35 bg-cyber-cyan/10 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-cyan-200"
            >
              {speed.label}
            </span>
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-obsidian/70 px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-muted">الخطوة</span>
            <span
              data-testid="step-counter"
              className="tabular-nums-ltr font-mono font-bold text-chalk"
            >
              {currentStepNumber} / {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Slim step progress track */}
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="تقدم خطوات التنفيذ"
      >
        <div
          className="h-full rounded-full bg-gradient-to-l from-cyber-cyan via-cyber-purple to-cyber-pink transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </GlassCard>
  );
}
