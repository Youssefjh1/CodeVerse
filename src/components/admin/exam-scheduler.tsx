"use client";

import { CalendarPlus, Eye, EyeOff, Timer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import type { ExamCadence, ScheduledExam } from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

interface ExamSchedulerProps {
  exams: ScheduledExam[];
  approvedQuestionCount: number;
  onExamCreated: (exam: ScheduledExam) => void;
  onExamUpdated: (exam: ScheduledExam) => void;
}

export function ExamScheduler({
  exams,
  approvedQuestionCount,
  onExamCreated,
  onExamUpdated,
}: ExamSchedulerProps) {
  const [titleAr, setTitleAr] = useState("اختبار أسبوعي عشوائي — مراجعة شاملة");
  const [grade, setGrade] = useState<GradeTier | "all">("grade_11");
  const [examCadence, setExamCadence] = useState<ExamCadence>("weekly");
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [xpReward, setXpReward] = useState(250);
  const [coinsReward, setCoinsReward] = useState(75);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleAr,
          grade,
          examCadence,
          questionCount,
          durationMinutes,
          xpReward,
          coinsReward,
          isPublished,
        }),
      });
      const data = (await response.json()) as {
        exam?: ScheduledExam;
        error?: string;
      };
      if (!response.ok || !data.exam) {
        setErrorMessage(data.error ?? "تعذر إنشاء الامتحان.");
        return;
      }
      onExamCreated(data.exam);
      setFeedback(`تم إنشاء "${data.exam.titleAr}" بـ ${data.exam.questionCount} سؤال عشوائي.`);
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (exam: ScheduledExam) => {
    setTogglingId(exam.id);
    try {
      const response = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          isPublished: !exam.isPublished,
        }),
      });
      const data = (await response.json()) as { exam?: ScheduledExam };
      if (response.ok && data.exam) {
        onExamUpdated(data.exam);
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-cyber-cyan" />
          <div>
            <h3 className="text-base font-extrabold text-chalk">
              مجدول الامتحانات الأسبوعية والشهرية
            </h3>
            <p className="text-xs text-slate-muted">
              يسحب أسئلة عشوائية معتمدة من بنك الأسئلة ({approvedQuestionCount} متاح)
            </p>
          </div>
        </div>

        <Link
          href="/arena"
          className="text-xs font-bold text-cyan-200 underline-offset-4 hover:underline"
        >
          معاينة في ساحة التحديات
        </Link>
      </div>

      <form onSubmit={(e) => void handleCreate(e)} className="mt-4 space-y-3.5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block text-xs font-bold text-slate-muted md:col-span-1">
            عنوان الامتحان
            <input
              type="text"
              required
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk focus:border-cyber-cyan focus:outline-none"
            />
          </label>

          <label className="block text-xs font-bold text-slate-muted">
            الصف المستهدف
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeTier | "all")}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
            >
              <option value="grade_10">أولى ثانوي</option>
              <option value="grade_11">تانية ثانوي</option>
              <option value="other">صفوف أخرى</option>
              <option value="all">كل الصفوف</option>
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-muted">
            الدورية
            <select
              value={examCadence}
              onChange={(e) => setExamCadence(e.target.value as ExamCadence)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
            >
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="practice">تدريبي</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block text-xs font-bold text-slate-muted">
            عدد الأسئلة
            <input
              type="number"
              min={1}
              max={30}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
            />
          </label>

          <label className="block text-xs font-bold text-slate-muted">
            المدة (دقائق)
            <input
              type="number"
              min={1}
              max={180}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
            />
          </label>

          <label className="block text-xs font-bold text-slate-muted">
            مكافأة XP
            <input
              type="number"
              min={0}
              step={10}
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
            />
          </label>

          <label className="block text-xs font-bold text-slate-muted">
            العملات
            <input
              type="number"
              min={0}
              step={5}
              value={coinsReward}
              onChange={(e) => setCoinsReward(Number(e.target.value))}
              className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-chalk">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 accent-cyber-cyan"
            />
            <span>نشر الامتحان فوراً للطلاب</span>
          </label>

          <CyberButton type="submit" variant="primary" size="sm" disabled={submitting}>
            <CalendarPlus className="h-4 w-4" />
            {submitting ? "جاري الجدولة..." : "إنشاء وجدولة الامتحان"}
          </CyberButton>
        </div>
      </form>

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-3 rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200">
          {feedback}
        </p>
      ) : null}

      <div className="mt-5 space-y-2.5">
        {exams.map((exam) => (
          <div
            key={exam.id}
            data-testid={`scheduled-exam-${exam.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian/80 px-4 py-3"
          >
            <div>
              <p className="text-xs font-extrabold text-white">{exam.titleAr}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-muted">
                <span>
                  {exam.grade === "all" ? "كل الصفوف" : GRADE_LABELS[exam.grade]}
                </span>
                <span className="tabular-nums-ltr font-mono">
                  {exam.questionCount} سؤال
                </span>
                <span className="tabular-nums-ltr inline-flex items-center gap-1 font-mono">
                  <Timer className="h-3 w-3 text-cyber-cyan" />
                  {exam.durationMinutes}m
                </span>
                <span className="tabular-nums-ltr font-mono text-purple-200">
                  +{exam.xpReward} XP
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={togglingId === exam.id}
              onClick={() => void handleTogglePublish(exam)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-chalk hover:border-cyber-cyan/50"
            >
              {exam.isPublished ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-300" />
                  منشور
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-slate-muted" />
                  مسودة
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
