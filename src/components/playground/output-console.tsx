"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Terminal, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { ExecutionError, OutputEntry } from "@/types/playground";

interface OutputConsoleProps {
  output: OutputEntry[];
  activeStepIndex: number;
  error: ExecutionError | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function OutputConsole({
  output,
  activeStepIndex,
  error,
  soundEnabled,
  onToggleSound,
}: OutputConsoleProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [output.length, error]);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/15 text-cyber-cyan">
            <Terminal className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-chalk">شاشة المخرجات</h3>
            <p className="text-[11px] text-slate-muted">
              تطبع النتائج بترتيب تنفيذ الأسطر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label="تبديل المؤثرات الصوتية"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
              soundEnabled
                ? "border-cyber-cyan/55 bg-cyber-cyan/15 text-cyan-200 shadow-neon-cyan"
                : "border-white/10 bg-white/5 text-slate-muted hover:border-white/25 hover:text-chalk",
            )}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-cyber-cyan" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            <span>{soundEnabled ? "صوت مفعّل" : "صوت صامت"}</span>
          </button>

          <span className="tabular-nums-ltr rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-muted">
            {output.length}
          </span>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-3 rounded-xl border border-rose-500/45 bg-rose-500/10 p-3 text-xs text-rose-100"
        >
          <div className="flex items-center gap-2 font-extrabold text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>تنبيه خطأ في السطر {error.line}</span>
          </div>
          <p className="mt-1 leading-relaxed">{error.messageAr}</p>
          {error.hintAr ? (
            <p className="mt-1 text-[11px] text-rose-200/85">{error.hintAr}</p>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        dir="ltr"
        data-testid="output-console"
        className="code-ltr max-h-[240px] min-h-[156px] space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-[#06070B] p-3 font-mono text-xs"
      >
        {output.length === 0 ? (
          <div className="flex h-[126px] flex-col items-center justify-center gap-1 text-center text-slate-500">
            <span>$ awaiting execution...</span>
            <span dir="rtl" className="font-sans text-[11px] text-slate-muted">
              لا توجد مخرجات مطبوعة حتى هذه الخطوة
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {output.map((entry, idx) => {
              const isFresh =
                idx === output.length - 1 && entry.stepIndex === activeStepIndex;
              const isErrorEntry = entry.kind === "error";

              return (
                <motion.div
                  key={entry.id}
                  data-testid="console-output-line"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-2.5 py-1.5",
                    isErrorEntry
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : isFresh
                        ? "border-cyber-cyan/55 bg-cyber-cyan/15 text-cyan-100 shadow-neon-cyan"
                        : "border-white/5 bg-white/[0.02] text-emerald-200",
                  )}
                >
                  <span className="select-none text-[10px] text-slate-500">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="select-none text-cyber-cyan">&gt;</span>
                  <span className="break-words">{entry.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}
