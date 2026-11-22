"use client";

import { CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { ExecutionStep, StepKind } from "@/types/playground";

const STEP_KIND_META: Record<
  StepKind,
  { labelAr: string; badgeClass: string }
> = {
  assign: {
    labelAr: "تعيين متغير",
    badgeClass: "border-cyber-purple/45 bg-cyber-purple/15 text-purple-200",
  },
  condition: {
    labelAr: "فحص شرط",
    badgeClass: "border-amber-400/45 bg-amber-400/15 text-amber-200",
  },
  loop_init: {
    labelAr: "بدء حلقة",
    badgeClass: "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
  },
  loop_check: {
    labelAr: "فحص الحلقة",
    badgeClass: "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
  },
  loop_update: {
    labelAr: "دورة تكرار",
    badgeClass: "border-cyber-pink/45 bg-cyber-pink/15 text-pink-200",
  },
  output: {
    labelAr: "طباعة",
    badgeClass: "border-emerald-400/45 bg-emerald-400/15 text-emerald-200",
  },
  program_end: {
    labelAr: "انتهاء التنفيذ",
    badgeClass: "border-emerald-400/45 bg-emerald-400/15 text-emerald-200",
  },
  error: {
    labelAr: "تنبيه خطأ",
    badgeClass: "border-rose-500/50 bg-rose-500/15 text-rose-200",
  },
};

interface StepExplanationBannerProps {
  activeStep: ExecutionStep | null;
  lessonGoalAr: string;
}

export function StepExplanationBanner({
  activeStep,
  lessonGoalAr,
}: StepExplanationBannerProps) {
  if (!activeStep) {
    return (
      <GlassCard className="border-cyber-cyan/25 p-4" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/15 text-cyber-cyan">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-cyan-200">
              جاهز للتشغيل خطوة بخطوة
            </p>
            <p className="text-sm leading-relaxed text-chalk">{lessonGoalAr}</p>
            <p className="text-xs text-slate-muted">
              اضغط «خطوة للأمام» لتتبع كل سطر، أو «تشغيل الكل» لمشاهدة الذاكرة والمخرجات تتحرك تلقائياً.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const kindMeta = STEP_KIND_META[activeStep.kind];

  return (
    <GlassCard
      data-testid="step-explanation"
      className="border-cyber-cyan/35 p-4"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums-ltr rounded-lg border border-cyber-cyan/45 bg-cyber-cyan/15 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-200">
            السطر {activeStep.line}
          </span>
          <span
            className={cn(
              "rounded-lg border px-2.5 py-0.5 text-xs font-bold",
              kindMeta.badgeClass,
            )}
          >
            {kindMeta.labelAr}
          </span>
        </div>

        {activeStep.conditionResult !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold",
              activeStep.conditionResult
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                : "border-rose-400/50 bg-rose-400/15 text-rose-200",
            )}
          >
            {activeStep.conditionResult ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                الشرط صحيح
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                الشرط خاطئ
              </>
            )}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm font-bold leading-relaxed text-white">
        {activeStep.explanationAr}
      </p>

      {activeStep.lessonTipAr ? (
        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-cyber-purple/25 bg-cyber-purple/10 px-3 py-2 text-xs text-purple-100">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyber-purple" />
          <span>{activeStep.lessonTipAr}</span>
        </div>
      ) : null}
    </GlassCard>
  );
}
