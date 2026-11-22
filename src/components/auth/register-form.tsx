"use client";

import { KeyRound, Mail, Phone, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { signUpAction, type AuthFormState } from "@/lib/auth/actions";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { GradeTier } from "@/types/gamification";

const INITIAL_STATE: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, INITIAL_STATE);
  const [selectedGrade, setSelectedGrade] = useState<GradeTier>("grade_10");

  return (
    <GlassCard variant="hero" className="w-full max-w-lg p-6 sm:p-8">
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold text-white">انضم لأبطال CodeVerse</h1>
        <p className="text-sm text-slate-muted">
          اختار صفك الدراسي وجهّز بطاقة اللاعب بتاعتك في ثواني
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-xs font-bold text-chalk"
          >
            الاسم الكامل
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
            <input
              id="register-name"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="مثال: يوسف طارق محمد"
              className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-xs font-bold text-chalk"
            >
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-left font-mono text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-phone"
              className="mb-1.5 block text-xs font-bold text-chalk"
            >
              رقم الموبايل
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
              <input
                id="register-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                dir="ltr"
                placeholder="01012345678"
                className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-left font-mono text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-xs font-bold text-chalk"
          >
            كلمة المرور
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
            <input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-left font-mono text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-bold text-chalk">
            اختار الصف الدراسي
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GRADE_LABELS) as GradeTier[]).map((gradeKey) => {
              const checked = selectedGrade === gradeKey;
              return (
                <label
                  key={gradeKey}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-center text-xs font-bold transition",
                    checked
                      ? "border-cyber-cyan bg-cyber-cyan/15 text-cyan-200 shadow-neon-cyan"
                      : "border-white/15 bg-obsidian/80 text-slate-muted hover:border-white/30 hover:text-chalk",
                  )}
                >
                  <input
                    type="radio"
                    name="grade"
                    value={gradeKey}
                    checked={checked}
                    onChange={() => setSelectedGrade(gradeKey)}
                    className="sr-only"
                  />
                  <span>{GRADE_LABELS[gradeKey]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-cyber-pink/40 bg-cyber-pink/10 px-3 py-2 text-xs font-semibold text-pink-200"
          >
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p
            role="status"
            className="rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 px-3 py-2 text-xs font-semibold text-cyan-200"
          >
            {state.success}
          </p>
        ) : null}

        <CyberButton
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full py-3"
        >
          <UserPlus className="h-4 w-4" />
          {isPending ? "جاري تجهيز الحساب..." : "ابدأ رحلتك الآن"}
        </CyberButton>
      </form>

      <p className="mt-6 text-center text-xs text-slate-muted">
        عندك حساب بالفعل؟{" "}
        <Link
          href="/login"
          className="font-bold text-cyber-cyan underline-offset-4 hover:underline"
        >
          سجل دخولك هنا
        </Link>
      </p>
    </GlassCard>
  );
}
