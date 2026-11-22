"use client";

import { Bug, Flame, RotateCcw, Terminal, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  calculateCodeChallengeReward,
  getStreakMultiplier,
} from "@/lib/arena/scoring";
import { cn } from "@/lib/utils";
import type { BankQuestion } from "@/types/arena";

interface CodeChallengeGameProps {
  mode: "output_rush" | "debug_duel";
  questions: BankQuestion[];
  onEarnXp: (xpDelta: number) => void;
}

export function CodeChallengeGame({
  mode,
  questions,
  onEarnXp,
}: CodeChallengeGameProps) {
  const roundDuration = mode === "debug_duel" ? 30 : 20;
  const isOutputRush = mode === "output_rush";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(roundDuration);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const activeQuestion = questions[currentIndex] ?? null;
  const isRevealed = selectedOption !== null || timedOut;

  useEffect(() => {
    setCurrentIndex(0);
    setSecondsLeft(roundDuration);
    setSelectedOption(null);
    setTimedOut(false);
    setStreak(0);
    setCorrectCount(0);
    setTotalXp(0);
    setLastXp(0);
    setFinished(false);
  }, [mode, roundDuration]);

  useEffect(() => {
    if (finished || isRevealed || !activeQuestion) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setTimedOut(true);
          setStreak(0);
          setLastXp(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, isRevealed, activeQuestion]);

  const handleSelectOption = (option: string) => {
    if (!activeQuestion || isRevealed) return;
    const isCorrect = option === activeQuestion.correctAnswer;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const reward = calculateCodeChallengeReward(
      mode,
      isCorrect,
      secondsLeft,
      nextStreak,
    );

    setSelectedOption(option);
    setStreak(nextStreak);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setLastXp(reward.xpEarned);
    if (reward.xpEarned > 0) {
      setTotalXp((prev) => prev + reward.xpEarned);
      onEarnXp(reward.xpEarned);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSecondsLeft(roundDuration);
    setSelectedOption(null);
    setTimedOut(false);
    setLastXp(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSecondsLeft(roundDuration);
    setSelectedOption(null);
    setTimedOut(false);
    setStreak(0);
    setCorrectCount(0);
    setTotalXp(0);
    setLastXp(0);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <GlassCard className="p-6 text-center text-sm text-slate-muted">
        لا توجد تحديات متاحة في هذا الوضع حالياً.
      </GlassCard>
    );
  }

  if (finished) {
    return (
      <GlassCard variant="hero" className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyber-cyan/45 bg-cyber-cyan/15 text-cyber-cyan">
          {isOutputRush ? (
            <Terminal className="h-7 w-7" />
          ) : (
            <Bug className="h-7 w-7" />
          )}
        </div>
        <h3 className="mt-4 text-xl font-extrabold text-chalk">
          {isOutputRush ? "انتهى تحدي Output Rush!" : "انتهت مبارزة Debug Duel!"}
        </h3>
        <p className="mt-1 text-sm text-slate-muted">
          النتيجة: {correctCount} / {questions.length} — إجمالي نقاط الخبرة المكتسبة:{" "}
          <span className="tabular-nums-ltr font-mono font-bold text-cyan-200">
            +{totalXp} XP
          </span>
        </p>

        <div className="mt-6 flex justify-center">
          <CyberButton variant="cyan" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" />
            أعد التحدي
          </CyberButton>
        </div>
      </GlassCard>
    );
  }

  const isCorrectChoice =
    selectedOption !== null && selectedOption === activeQuestion.correctAnswer;

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold",
              isOutputRush
                ? "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200"
                : "border-cyber-purple/45 bg-cyber-purple/15 text-purple-200",
            )}
          >
            {isOutputRush ? (
              <Terminal className="h-3.5 w-3.5" />
            ) : (
              <Bug className="h-3.5 w-3.5" />
            )}
            {isOutputRush ? "Output Rush" : "Debug Duel"}
          </span>

          <span className="code-ltr rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-cyan-200">
            {activeQuestion.language}
          </span>

          <span className="tabular-nums-ltr rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-slate-muted">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold text-amber-200">
            <Flame className="h-3.5 w-3.5" />
            <span className="tabular-nums-ltr font-mono">
              x{getStreakMultiplier(streak)}
            </span>
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-sm font-extrabold tabular-nums-ltr",
              secondsLeft <= 5 && !isRevealed
                ? "border-rose-500/60 bg-rose-500/20 text-rose-200"
                : "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
            )}
          >
            <Timer className="h-4 w-4" />
            {secondsLeft}s
          </span>
        </div>
      </div>

      <p className="mt-4 text-base font-extrabold text-white">
        {activeQuestion.promptAr}
      </p>

      {activeQuestion.codeSnippet ? (
        <div
          dir="ltr"
          data-testid="arena-code-block"
          className="code-ltr mt-3 overflow-x-auto rounded-2xl border border-cyber-cyan/30 bg-[#06070B] p-4 text-xs leading-6 text-cyan-100"
        >
          {activeQuestion.codeSnippet.split("\n").map((line, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="select-none text-slate-500">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {activeQuestion.options.map((option) => {
          const isPicked = selectedOption === option;
          const isRightOption = option === activeQuestion.correctAnswer;

          return (
            <button
              key={option}
              type="button"
              dir={isOutputRush ? "ltr" : "rtl"}
              disabled={isRevealed}
              onClick={() => handleSelectOption(option)}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan disabled:cursor-default",
                isOutputRush ? "code-ltr text-left" : "text-right",
                !isRevealed &&
                  "border-white/15 bg-obsidian/80 text-chalk hover:border-cyber-cyan/55 hover:bg-cyber-cyan/10",
                isRevealed &&
                  isRightOption &&
                  "border-emerald-400 bg-emerald-500/20 text-emerald-100",
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
              {option}
            </button>
          );
        })}
      </div>

      {isRevealed ? (
        <div
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
                ? "انتهى الوقت!"
                : isCorrectChoice
                  ? "حل ممتاز!"
                  : "إجابة خاطئة — راجع التفسير"}
            </span>
            {lastXp > 0 ? (
              <span className="tabular-nums-ltr inline-flex items-center gap-1 rounded-full border border-cyber-cyan/50 bg-cyber-cyan/20 px-3 py-0.5 font-mono text-xs font-extrabold text-cyan-100">
                <Zap className="h-3.5 w-3.5 text-cyber-cyan" />+{lastXp} XP
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-chalk/90">
            {activeQuestion.explanationAr}
          </p>
          <div className="mt-4 flex justify-end">
            <CyberButton variant="primary" size="sm" onClick={handleNext}>
              {currentIndex + 1 >= questions.length
                ? "عرض النتيجة النهائية"
                : "التحدي التالي"}
            </CyberButton>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
