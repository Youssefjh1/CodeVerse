"use client";

import { Check, Flame, RotateCcw, Sparkles, Timer, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  calculateFactOrCapReward,
  getStreakMultiplier,
} from "@/lib/arena/scoring";
import { cn } from "@/lib/utils";
import type { BankQuestion } from "@/types/arena";

const ROUND_SECONDS = 10;

interface FactOrCapGameProps {
  questions: BankQuestion[];
  onEarnXp: (xpDelta: number) => void;
}

export function FactOrCapGame({ questions, onEarnXp }: FactOrCapGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [lastRoundXp, setLastRoundXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const activeQuestion = questions[currentIndex] ?? null;
  const isRevealed = selectedAnswer !== null || timedOut;
  const multiplier = getStreakMultiplier(streak);

  useEffect(() => {
    if (finished || isRevealed || !activeQuestion) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setTimedOut(true);
          setStreak(0);
          setLastRoundXp(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, isRevealed, activeQuestion]);

  const handleChoose = useCallback(
    (choice: "حقيقة" | "هبد") => {
      if (!activeQuestion || isRevealed) return;
      const isCorrect = choice === activeQuestion.correctAnswer;
      const nextStreak = isCorrect ? streak + 1 : 0;
      const reward = calculateFactOrCapReward(
        isCorrect,
        secondsLeft,
        nextStreak,
      );

      setSelectedAnswer(choice);
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      setLastRoundXp(reward.xpEarned);
      if (reward.xpEarned > 0) {
        setTotalXp((prev) => prev + reward.xpEarned);
        onEarnXp(reward.xpEarned);
      }
    },
    [activeQuestion, isRevealed, onEarnXp, secondsLeft, streak],
  );

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSecondsLeft(ROUND_SECONDS);
    setSelectedAnswer(null);
    setTimedOut(false);
    setLastRoundXp(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSecondsLeft(ROUND_SECONDS);
    setSelectedAnswer(null);
    setTimedOut(false);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTotalXp(0);
    setLastRoundXp(0);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <GlassCard className="p-6 text-center text-sm text-slate-muted">
        لا توجد عبارات «حقيقة ولا هبد» متاحة حالياً.
      </GlassCard>
    );
  }

  if (finished) {
    return (
      <GlassCard variant="hero" className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyber-pink/40 bg-cyber-pink/15 text-cyber-pink">
          <Sparkles className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-extrabold text-chalk">
          انتهت جولة حقيقة ولا هبد!
        </h3>
        <p className="mt-1 text-sm text-slate-muted">
          أجبت على {correctCount} من {questions.length} جملة بنجاح
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
            <p className="text-[11px] text-slate-muted">إجمالي XP</p>
            <p className="tabular-nums-ltr mt-1 font-mono text-lg font-extrabold text-cyan-200">
              +{totalXp}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
            <p className="text-[11px] text-slate-muted">أعلى سلسلة</p>
            <p className="tabular-nums-ltr mt-1 font-mono text-lg font-extrabold text-pink-200">
              {bestStreak}x
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
            <p className="text-[11px] text-slate-muted">الدقة</p>
            <p className="tabular-nums-ltr mt-1 font-mono text-lg font-extrabold text-emerald-200">
              {Math.round((correctCount / questions.length) * 100)}%
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <CyberButton variant="primary" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" />
            العب جولة جديدة
          </CyberButton>
        </div>
      </GlassCard>
    );
  }

  const timerPercent = Math.round((secondsLeft / ROUND_SECONDS) * 100);
  const isCorrectChoice =
    selectedAnswer !== null && selectedAnswer === activeQuestion.correctAnswer;

  return (
    <GlassCard className="p-5 sm:p-6">
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cyber-pink/40 bg-cyber-pink/15 px-3 py-1 text-xs font-extrabold text-pink-200">
            حقيقة ولا هبد
          </span>
          <span className="tabular-nums-ltr rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-slate-muted">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-chalk">
            {activeQuestion.topic}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            data-testid="foc-streak-badge"
            className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold text-amber-200"
          >
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            <span className="tabular-nums-ltr font-mono">
              {streak} · x{multiplier}
            </span>
          </span>

          <span
            data-testid="foc-timer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-sm font-extrabold tabular-nums-ltr",
              secondsLeft <= 3 && !isRevealed
                ? "border-rose-500/60 bg-rose-500/20 text-rose-200"
                : "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
            )}
          >
            <Timer className="h-4 w-4" />
            {secondsLeft}s
          </span>
        </div>
      </div>

      {/* 10s Countdown Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            secondsLeft <= 3
              ? "bg-gradient-to-l from-rose-500 to-amber-400"
              : "bg-gradient-to-l from-cyber-cyan to-cyber-purple",
          )}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Statement Card */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-obsidian/85 p-5">
        <p className="text-base font-extrabold leading-relaxed text-white sm:text-lg">
          {activeQuestion.promptAr}
        </p>

        {activeQuestion.codeSnippet ? (
          <pre
            dir="ltr"
            className="code-ltr mt-4 overflow-x-auto rounded-xl border border-cyber-cyan/25 bg-[#06070B] p-3.5 text-xs leading-6 text-cyan-200"
          >
            <code>{activeQuestion.codeSnippet}</code>
          </pre>
        ) : null}
      </div>

      {/* Rapid-Fire Choices */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["حقيقة", "هبد"] as const).map((option) => {
          const isFact = option === "حقيقة";
          const isPicked = selectedAnswer === option;
          const isRightOption = option === activeQuestion.correctAnswer;

          return (
            <button
              key={option}
              type="button"
              disabled={isRevealed}
              onClick={() => handleChoose(option)}
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-2xl border px-5 py-4 text-base font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan disabled:cursor-default",
                !isRevealed &&
                  (isFact
                    ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20"
                    : "border-cyber-pink/45 bg-cyber-pink/10 text-pink-200 hover:border-cyber-pink hover:bg-cyber-pink/20"),
                isRevealed &&
                  isRightOption &&
                  "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-neon-cyan",
                isRevealed &&
                  isPicked &&
                  !isRightOption &&
                  "border-rose-500 bg-rose-500/20 text-rose-100",
                isRevealed &&
                  !isPicked &&
                  !isRightOption &&
                  "border-white/10 bg-white/[0.02] text-slate-muted opacity-60",
              )}
            >
              {isFact ? (
                <Check className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Reveal Feedback & Explanation */}
      {isRevealed ? (
        <div
          data-testid="foc-feedback"
          className={cn(
            "mt-5 rounded-2xl border p-4",
            isCorrectChoice
              ? "border-emerald-400/45 bg-emerald-500/10"
              : "border-rose-500/45 bg-rose-500/10",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-white">
              {timedOut
                ? `انتهى الوقت! الإجابة الصحيحة هي: ${activeQuestion.correctAnswer}`
                : isCorrectChoice
                  ? "إجابة صاروخية صحيحة!"
                  : `غير صحيح — الإجابة هي: ${activeQuestion.correctAnswer}`}
            </span>

            {lastRoundXp > 0 ? (
              <span className="tabular-nums-ltr inline-flex items-center gap-1 rounded-full border border-cyber-cyan/50 bg-cyber-cyan/20 px-3 py-0.5 font-mono text-xs font-extrabold text-cyan-100">
                <Zap className="h-3.5 w-3.5 text-cyber-cyan" />+{lastRoundXp} XP
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-chalk/90">
            {activeQuestion.explanationAr}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="tabular-nums-ltr font-mono text-xs text-slate-muted">
              رصيد الجولة: +{totalXp} XP
            </span>
            <CyberButton variant="cyan" size="sm" onClick={handleNext}>
              {currentIndex + 1 >= questions.length
                ? "عرض ملخص الجولة"
                : "العبارة التالية"}
            </CyberButton>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
