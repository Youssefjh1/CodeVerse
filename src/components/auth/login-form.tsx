"use client";

import { KeyRound, LogIn, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  enterDemoModeAction,
  signInAction,
  type AuthFormState,
} from "@/lib/auth/actions";

interface LoginFormProps {
  demoModeEnabled: boolean;
}

const INITIAL_STATE: AuthFormState = {};

export function LoginForm({ demoModeEnabled }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <GlassCard variant="hero" className="w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold text-white">تسجيل الدخول إلى CodeVerse</h1>
        <p className="text-sm text-slate-muted">
          ارجع كمل رحلتك وحافظ على سلسلة التزامك اليومية
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-xs font-bold text-chalk"
          >
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              placeholder="student@codeverse.eg"
              className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-left font-mono text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-xs font-bold text-chalk"
          >
            كلمة المرور
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-muted" />
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-obsidian/90 py-2.5 pl-4 pr-10 text-left font-mono text-sm text-chalk placeholder:text-slate-muted/60 focus:border-cyber-cyan focus:outline-none focus:ring-2 focus:ring-cyber-cyan/40"
            />
          </div>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-cyber-pink/40 bg-cyber-pink/10 px-3 py-2 text-xs font-semibold text-pink-200"
          >
            {state.error}
          </p>
        ) : null}

        <CyberButton
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full py-3"
        >
          <LogIn className="h-4 w-4" />
          {isPending ? "جاري تسجيل الدخول..." : "دخول للمنصة"}
        </CyberButton>
      </form>

      {demoModeEnabled ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <form action={enterDemoModeAction}>
            <CyberButton type="submit" variant="cyan" className="w-full py-2.5">
              <Sparkles className="h-4 w-4" />
              دخول تجريبي فوري
            </CyberButton>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-muted">
            تقدر تجرب لوحة الطالب أو الإدارة بدون إعدادات قاعدة البيانات
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-slate-muted">
        لسه جديد في CodeVerse؟{" "}
        <Link
          href="/register"
          className="font-bold text-cyber-cyan underline-offset-4 hover:underline"
        >
          أنشئ حساب لاعب جديد
        </Link>
      </p>
    </GlassCard>
  );
}
