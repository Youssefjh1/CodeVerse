"use client";

import {
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Timer,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type {
  ExamCadence,
  ExamGradingResult,
  SanitizedExamQuestion,
  ScheduledExam,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

const CADENCE_LABELS: Record<ExamCadence, string> = {
  weekly: "اختبار أسبوعي",
  monthly: "امتحان شهري",
  practice: "تدريب حر",
};

interface ScheduledExamsPanelProps {
  exams: ScheduledExam[];
  defaultGrade: GradeTier;
  onEarnXp: (xpDelta: number) => void;
}

export function ScheduledExamsPanel({
  exams,
  defaultGrade,
  onEarnXp,
}: ScheduledExamsPanelProps) {
  const [gradeFilter, setGradeFilter] = useState<"all" | "grade_10" | "grade_11">(
    defaultGrade === "grade_10" ? "grade_10" : "all",
  );
  const [activeExam, setActiveExam] = useState<ScheduledExam | null>(null);
  const [questions, setQuestions] = useState<SanitizedExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loadingExam, setLoadingExam] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ExamGradingResult | null>(null);

  const visibleExams = exams.filter(
    (exam) =>
      gradeFilter === "all" || exam.grade === "all" || exam.grade === gradeFilter,
  );

  const handleSubmitExam = useCallback(async () => {
    if (!activeExam || submitting || result) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/arena/exams/${activeExam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await response.json()) as ExamGradingResult & {
        error?: string;
      };
      if (!response.ok) {
        setErrorMessage(data.error ?? "تعذر تسليم الامتحان.");
        return;
      }
      setResult(data);
      if (data.xpAwarded > 0) {
        onEarnXp(data.xpAwarded);
      }
    } catch {
      setErrorMessage("حدث خطأ في الاتصال أثناء تصحيح الامتحان.");
    } finally {
      setSubmitting(false);
    }
  }, [activeExam, answers, onEarnXp, result, submitting]);

  useEffect(() => {
    if (!activeExam || result || loadingExam) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeExam, result, loadingExam, handleSubmitExam]);

  const handleStartExam = async (examId: number) => {
    setLoadingExam(true);
    setErrorMessage(null);
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch(`/api/arena/exams/${examId}`);
      const data = (await res.json()) as {
        exam?: ScheduledExam;
        questions?: SanitizedExamQuestion[];
        error?: string;
      };
      if (!res.ok || !data.exam || !data.questions) {
        setErrorMessage(data.error ?? "تعذر تحميل أسئلة الامتحان.");
        return;
      }
      setActiveExam(data.exam);
      setQuestions(data.questions);
      setSecondsLeft(data.exam.durationMinutes * 60);
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم لفتح الامتحان.");
    } finally {
      setLoadingExam(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (activeExam && result) {
    return (
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/45 bg-emerald-500/15 text-emerald-200">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                نتيجة: {activeExam.titleAr}
              </h3>
              <p className="text-xs text-slate-muted">
                تم التصحيح التلقائي فوراً وحفظ الدرجة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="tabular-nums-ltr rounded-xl border border-cyber-cyan/50 bg-cyber-cyan/15 px-3 py-1.5 font-mono text-base font-extrabold text-cyan-100">
              {result.scorePercent}%
            </span>
            <span className="tabular-nums-ltr rounded-xl border border-cyber-purple/50 bg-cyber-purple/15 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-200">
              +{result.xpAwarded} XP
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {questions.map((q, idx) => {
            const graded = result.results.find((r) => r.questionId === q.id);
            const isCorrect = graded?.isCorrect ?? false;
            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-3.5 text-xs",
                  isCorrect
                    ? "border-emerald-400/35 bg-emerald-500/10"
                    : "border-rose-500/35 bg-rose-500/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-white">
                    س{idx + 1}: {q.promptAr}
                  </span>
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-300" />
                  )}
                </div>
                <p className="mt-1.5 text-slate-muted">
                  إجابتك:{" "}
                  <span className="font-bold text-chalk">
                    {graded?.selectedAnswer || "لم يُجب"}
                  </span>{" "}
                  · الصحيحة:{" "}
                  <span className="font-bold text-emerald-200">
                    {graded?.correctAnswer}
                  </span>
                </p>
                {graded?.explanationAr ? (
                  <p className="mt-1 text-chalk/85">{graded.explanationAr}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <CyberButton
            variant="ghost"
            onClick={() => {
              setActiveExam(null);
              setResult(null);
            }}
          >
            العودة لقائمة الامتحانات
          </CyberButton>
        </div>
      </GlassCard>
    );
  }

  if (activeExam) {
    return (
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="rounded-full border border-cyber-cyan/40 bg-cyber-cyan/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
              {CADENCE_LABELS[activeExam.examCadence]}
            </span>
            <h3 className="mt-1.5 text-lg font-extrabold text-white">
              {activeExam.titleAr}
            </h3>
          </div>

          <span
            data-testid="exam-countdown"
            className="tabular-nums-ltr inline-flex items-center gap-1.5 rounded-xl border border-cyber-pink/45 bg-cyber-pink/15 px-3.5 py-1.5 font-mono text-sm font-extrabold text-pink-200"
          >
            <Timer className="h-4 w-4" />
            {formatTimer(secondsLeft)}
          </span>
        </div>

        {errorMessage ? (
          <p role="alert" className="mt-3 rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 space-y-5">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 bg-obsidian/80 p-4"
            >
              <p className="text-sm font-extrabold text-white">
                <span className="tabular-nums-ltr ml-2 font-mono text-cyber-cyan">
                  #{idx + 1}
                </span>
                {q.promptAr}
              </p>

              {q.codeSnippet ? (
                <pre
                  dir="ltr"
                  className="code-ltr mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#06070B] p-3 text-xs text-cyan-200"
                >
                  <code>{q.codeSnippet}</code>
                </pre>
              ) : null}

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const chosen = answers[String(q.id)] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [String(q.id)]: opt }))
                      }
                      className={cn(
                        "rounded-xl border px-3.5 py-2.5 text-right text-xs font-bold transition",
                        chosen
                          ? "border-cyber-cyan bg-cyber-cyan/20 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-chalk hover:border-cyber-purple/45",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={() => setActiveExam(null)}
          >
            إلغاء الامتحان
          </CyberButton>

          <CyberButton
            variant="primary"
            disabled={submitting}
            onClick={() => void handleSubmitExam()}
          >
            <ClipboardCheck className="h-4 w-4" />
            {submitting ? "جاري التصحيح..." : "تسليم الامتحان"}
          </CyberButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-chalk">
            الامتحانات الأسبوعية والشهرية المجدولة
          </h3>
          <p className="mt-0.5 text-xs text-slate-muted">
            امتحانات مؤقتة بتصحيح تلقائي فوري من الخادم بدون تسريب الإجابات
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-obsidian p-1 text-xs">
          {(
            [
              { id: "all", label: "الكل" },
              { id: "grade_10", label: "أولى ثانوي" },
              { id: "grade_11", label: "تانية ثانوي" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setGradeFilter(f.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-bold transition",
                gradeFilter === f.id
                  ? "bg-cyber-purple/25 text-purple-100"
                  : "text-slate-muted hover:text-chalk",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {visibleExams.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-obsidian/60 p-6 text-center text-xs text-slate-muted">
            لا توجد امتحانات منشورة لهذا الصف حالياً.
          </div>
        ) : (
          visibleExams.map((exam) => (
            <div
              key={exam.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-obsidian/80 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                    {CADENCE_LABELS[exam.examCadence]}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-cyan-200">
                    {exam.grade === "all" ? "كل الصفوف" : GRADE_LABELS[exam.grade]}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-extrabold text-white">
                  {exam.titleAr}
                </h4>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5 text-cyber-cyan" />
                    <span className="tabular-nums-ltr font-mono">
                      {exam.durationMinutes}m
                    </span>
                  </span>
                  <span className="tabular-nums-ltr font-mono">
                    {exam.questionCount} سؤال
                  </span>
                  <span className="tabular-nums-ltr font-mono text-purple-200">
                    +{exam.xpReward} XP
                  </span>
                  <span className="tabular-nums-ltr inline-flex items-center gap-1 font-mono text-amber-300">
                    <Coins className="h-3.5 w-3.5" />
                    {exam.coinsReward}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
                <CyberButton
                  variant="cyan"
                  size="sm"
                  disabled={loadingExam}
                  onClick={() => void handleStartExam(exam.id)}
                >
                  {loadingExam ? "جاري الفتح..." : "ابدأ الامتحان"}
                </CyberButton>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
