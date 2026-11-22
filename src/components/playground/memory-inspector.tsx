"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { VariableSnapshot } from "@/types/playground";

interface MemoryInspectorProps {
  variables: VariableSnapshot[];
  stepIndex: number;
}

export function MemoryInspector({ variables, stepIndex }: MemoryInspectorProps) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyber-purple/40 bg-cyber-purple/15 text-cyber-purple">
            <Cpu className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-chalk">
              عارض الذاكرة والمتغيرات
            </h3>
            <p className="text-[11px] text-slate-muted">
              تتبع إنشاء وتحديث قيم المتغيرات لحظياً
            </p>
          </div>
        </div>

        <span className="tabular-nums-ltr rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-muted">
          {variables.length}
        </span>
      </div>

      {variables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-obsidian/60 px-4 py-6 text-center text-xs text-slate-muted">
          الذاكرة فارغة حالياً — ستظهر صناديق المتغيرات هنا فور تنفيذ أول سطر تعريف.
        </div>
      ) : (
        <div
          data-testid="memory-grid"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          <AnimatePresence initial={false}>
            {variables.map((variable) => {
              const isUpdated = variable.status === "updated";
              const isCreated = variable.status === "created";

              return (
                <motion.div
                  key={variable.name}
                  data-testid={`var-box-${variable.name}`}
                  data-var-status={variable.status}
                  initial={isCreated ? { opacity: 0, y: 8, scale: 0.96 } : false}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    borderColor: isUpdated
                      ? "rgba(6, 182, 212, 0.7)"
                      : isCreated
                        ? "rgba(6, 182, 212, 0.55)"
                        : "rgba(255, 255, 255, 0.1)",
                    boxShadow: isUpdated
                      ? "0 0 18px rgba(6, 182, 212, 0.28)"
                      : isCreated
                        ? "0 0 14px rgba(6, 182, 212, 0.18)"
                        : "0 0 0 rgba(0, 0, 0, 0)",
                  }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-obsidian/85 p-3",
                    isUpdated && "bg-cyber-pink/10",
                    isCreated && "bg-cyber-cyan/10",
                  )}
                >
                  {isUpdated ? (
                    <motion.div
                      key={`flash-${variable.name}-${stepIndex}`}
                      initial={{ opacity: 0.9 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 rounded-xl border-2 border-cyber-pink shadow-neon-pink"
                    />
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="code-ltr text-xs font-bold text-cyan-200">
                      {variable.name}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isUpdated ? (
                        <span className="rounded-md border border-cyber-pink/50 bg-cyber-pink/20 px-1.5 py-0.5 text-[10px] font-extrabold text-pink-200">
                          تحديث
                        </span>
                      ) : isCreated ? (
                        <span className="rounded-md border border-cyber-cyan/50 bg-cyber-cyan/20 px-1.5 py-0.5 text-[10px] font-extrabold text-cyan-200">
                          جديد
                        </span>
                      ) : null}

                      <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-muted">
                        {variable.typeLabelAr}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span
                      dir="ltr"
                      data-testid={`var-value-${variable.name}`}
                      className="code-ltr truncate text-lg font-extrabold text-white"
                    >
                      {variable.value}
                    </span>

                    {isUpdated && variable.previousValue !== undefined ? (
                      <span
                        dir="ltr"
                        data-testid={`var-diff-${variable.name}`}
                        className="code-ltr shrink-0 rounded-md border border-cyber-pink/40 bg-obsidian px-2 py-0.5 text-[11px] font-bold text-pink-200"
                      >
                        {variable.previousValue} -&gt; {variable.value}
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  );
}
