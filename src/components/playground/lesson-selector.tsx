"use client";

import { BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlaygroundLesson } from "@/types/playground";

interface LessonSelectorProps {
  lessons: readonly PlaygroundLesson[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSelector({
  lessons,
  activeLessonId,
  onSelectLesson,
}: LessonSelectorProps) {
  return (
    <section aria-label="الدروس التفاعلية الجاهزة" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-muted">
          <BookOpenCheck className="h-4 w-4 text-cyber-cyan" />
          <span>اختر درساً تفاعلياً جاهزاً أو عدّل الكود بنفسك</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {lessons.map((lesson, idx) => {
          const isActive = lesson.id === activeLessonId;
          return (
            <button
              key={lesson.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectLesson(lesson.id)}
              className={cn(
                "group flex flex-col justify-between rounded-2xl border p-4 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                isActive
                  ? "border-cyber-cyan/70 bg-gradient-to-bl from-cyber-cyan/15 via-obsidian-elevated to-cyber-purple/15 shadow-neon-cyan"
                  : "border-white/10 bg-obsidian-elevated/75 hover:border-cyber-purple/45 hover:bg-obsidian-elevated",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                    isActive
                      ? "border-cyber-cyan/50 bg-cyber-cyan/15 text-cyan-200"
                      : "border-white/10 bg-white/5 text-slate-muted",
                  )}
                >
                  {lesson.conceptTagAr}
                </span>
                <span className="tabular-nums-ltr font-mono text-[11px] font-semibold text-slate-muted">
                  0{idx + 1} · {lesson.levelLabelAr}
                </span>
              </div>

              <div className="mt-2.5">
                <h2
                  className={cn(
                    "text-sm font-extrabold sm:text-base",
                    isActive ? "text-white" : "text-chalk group-hover:text-white",
                  )}
                >
                  {lesson.titleAr}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-muted">
                  {lesson.subtitleAr}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
