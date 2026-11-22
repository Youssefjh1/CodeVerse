import { BookOpen, Code2, Coins, PlayCircle, Sparkles, Zap } from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import type {
  DailyChallengePreview,
  LastLessonPreview,
} from "@/types/gamification";

interface QuickLaunchCardsProps {
  dailyChallenge: DailyChallengePreview;
  playgroundPreviewCode: string;
  lastLesson: LastLessonPreview | null;
}

export function QuickLaunchCards({
  dailyChallenge,
  playgroundPreviewCode,
  lastLesson,
}: QuickLaunchCardsProps) {
  return (
    <section aria-label="انطلاق سريع" className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 1. Daily Challenge Card */}
      <GlassCard className="flex flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-pink/40 bg-cyber-pink/15 px-3 py-1 text-xs font-extrabold text-pink-200">
              <Zap className="h-3.5 w-3.5 text-cyber-pink" />
              تحدي اليوم
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-semibold text-chalk">
                {dailyChallenge.difficultyAr}
              </span>
              <span className="code-ltr rounded-md border border-cyber-cyan/30 bg-cyber-cyan/10 px-2 py-0.5 text-[11px] text-cyan-200">
                {dailyChallenge.language}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-chalk">
              {dailyChallenge.titleAr}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-muted">
              {dailyChallenge.descriptionAr}
            </p>
          </div>

          <pre
            data-testid="ltr-code-preview"
            dir="ltr"
            className="code-ltr overflow-x-auto rounded-xl border border-white/10 bg-obsidian/90 p-3 text-xs leading-5 text-cyan-200"
          >
            <code>{dailyChallenge.codePreview}</code>
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="tabular-nums-ltr font-mono text-purple-200">
              +{dailyChallenge.xpReward} XP
            </span>
            <span className="tabular-nums-ltr flex items-center gap-1 font-mono text-amber-300">
              <Coins className="h-3.5 w-3.5" />+{dailyChallenge.coinsReward}
            </span>
          </div>
          <CyberButton href="/arena" variant="primary" size="sm">
            ابدأ تحدي النهاردة
          </CyberButton>
        </div>
      </GlassCard>

      {/* 2. Interactive Code Playground Preview */}
      <GlassCard className="flex flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/15 px-3 py-1 text-xs font-extrabold text-cyan-200">
              <Code2 className="h-3.5 w-3.5 text-cyber-cyan" />
              محرر الكود التفاعلي
            </span>
            <span className="code-ltr rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-muted">
              binary_search.py
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-muted">
            جرب الأكواد سطر بسطر وتابع قيم المتغيرات في الذاكرة قبل الامتحان.
          </p>

          <pre
            data-testid="ltr-code-preview"
            dir="ltr"
            className="code-ltr overflow-x-auto rounded-xl border border-cyber-cyan/25 bg-obsidian/90 p-3 text-xs leading-5 text-purple-200"
          >
            <code>{playgroundPreviewCode}</code>
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <span className="inline-flex items-center gap-1 text-xs text-slate-muted">
            <Sparkles className="h-3.5 w-3.5 text-cyber-cyan" />
            نفّذ الكود خطوة بخطوة
          </span>
          <CyberButton href="/playground" variant="cyan" size="sm">
            افتح محرر الكود
          </CyberButton>
        </div>
      </GlassCard>

      {/* 3. Last Lesson Resume Card */}
      <GlassCard className="flex flex-col justify-between p-5">
        {lastLesson ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-3 py-1 text-xs font-extrabold text-purple-200">
                  <PlayCircle className="h-3.5 w-3.5 text-cyber-purple" />
                  آخر درس
                </span>
                <span className="text-xs font-semibold text-slate-muted">
                  {lastLesson.durationLabelAr}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-cyan-200">
                  {lastLesson.courseTitleAr}
                </p>
                <h3 className="mt-1 text-base font-extrabold text-chalk">
                  {lastLesson.lessonTitleAr}
                </h3>
              </div>

              <div className="rounded-xl border border-white/10 bg-obsidian/70 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-muted">نسبة الإنجاز</span>
                  <span className="tabular-nums-ltr font-mono font-bold text-cyan-200">
                    {lastLesson.progressPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-cyber-cyan to-cyber-purple"
                    style={{ width: `${lastLesson.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
              <span className="text-xs text-slate-muted">كمل من آخر ثانية وقفت عندها</span>
              <CyberButton href={lastLesson.href} variant="ghost" size="sm">
                كمل الدرس
              </CyberButton>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-3 py-1 text-xs font-extrabold text-purple-200">
                <BookOpen className="h-3.5 w-3.5 text-cyber-purple" />
                آخر درس
              </span>
              <h3 className="text-base font-extrabold text-chalk">
                ابدأ أول درس ليك في CodeVerse
              </h3>
              <p className="text-xs leading-relaxed text-slate-muted">
                مسارات البرمجة وعلوم الحاسب جاهزة لصفك الدراسي — اختار أول درس واجمع نقاط XP من أول دقيقة.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end border-t border-white/10 pt-4">
              <CyberButton href="/courses" variant="ghost" size="sm">
                استكشف الكورسات
              </CyberButton>
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}
