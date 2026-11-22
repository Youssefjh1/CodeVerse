"use client";

import { LogOut, UserCog } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  signOutAction,
  switchDemoRoleAction,
  updateGradeAction,
} from "@/lib/auth/actions";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { GradeTier, PlayerProfileSummary } from "@/types/gamification";

interface ShellControlsProps {
  mode: "demo" | "supabase";
  profile: PlayerProfileSummary;
  onActionDone?: () => void;
}

export function ShellControls({
  mode,
  profile,
  onActionDone,
}: ShellControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGradeChange = (grade: GradeTier) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateGradeAction(grade);
      if (!result.ok) {
        setErrorMessage(result.error ?? "تعذر تحديث الصف الدراسي.");
        return;
      }
      onActionDone?.();
    });
  };

  const handleRoleToggle = () => {
    const nextRole = profile.role === "admin" ? "student" : "admin";
    setErrorMessage(null);
    startTransition(async () => {
      const result = await switchDemoRoleAction(nextRole);
      if (!result.ok) {
        setErrorMessage(result.error ?? "تعذر تبديل الدور.");
        return;
      }
      onActionDone?.();
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-slate-muted">
          الصف الدراسي النشط
        </p>
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(GRADE_LABELS) as GradeTier[]).map((gradeKey) => (
            <button
              key={gradeKey}
              type="button"
              disabled={isPending}
              onClick={() => handleGradeChange(gradeKey)}
              className={cn(
                "rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                profile.grade === gradeKey
                  ? "border border-cyber-cyan/60 bg-cyber-cyan/15 text-cyan-200"
                  : "border border-white/10 bg-white/[0.02] text-slate-muted hover:text-chalk",
              )}
            >
              {GRADE_LABELS[gradeKey]}
            </button>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-cyber-pink/40 bg-cyber-pink/10 px-2.5 py-1.5 text-[11px] font-semibold text-pink-200"
        >
          {errorMessage}
        </p>
      ) : null}

      {mode === "demo" ? (
        <div className="rounded-xl border border-cyber-purple/25 bg-cyber-purple/10 p-2.5">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="font-bold text-purple-200">وضع تجريبي محلي</span>
            <Link
              href="/login"
              onClick={() => onActionDone?.()}
              className="text-cyber-cyan underline-offset-2 hover:underline"
            >
              شاشة الدخول
            </Link>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRoleToggle}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-obsidian/80 px-2.5 py-1.5 text-xs font-semibold text-chalk transition hover:border-cyber-pink/50"
          >
            <UserCog className="h-3.5 w-3.5 text-cyber-pink" />
            {profile.role === "admin"
              ? "التبديل لحساب طالب"
              : "معاينة لوحة الإدارة"}
          </button>
        </div>
      ) : (
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-muted transition hover:border-cyber-pink/40 hover:text-pink-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            تسجيل الخروج
          </button>
        </form>
      )}
    </div>
  );
}
