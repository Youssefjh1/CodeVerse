import type {
  BankQuestion,
  ExamGradingResult,
  ExamQuestionResult,
  SanitizedExamQuestion,
  ScheduledExam,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

export function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  if (streak >= 2) return 1.5;
  return 1;
}

export function calculateFactOrCapReward(
  isCorrect: boolean,
  remainingSeconds: number,
  nextStreak: number,
): { xpEarned: number; coinsEarned: number; multiplier: number } {
  if (!isCorrect) {
    return { xpEarned: 0, coinsEarned: 0, multiplier: 1 };
  }
  const multiplier = getStreakMultiplier(nextStreak);
  const speedBonus = Math.max(0, Math.round(remainingSeconds)) * 4;
  const xpEarned = Math.round((35 + speedBonus) * multiplier);
  const coinsEarned = nextStreak >= 3 ? 12 : 6;
  return { xpEarned, coinsEarned, multiplier };
}

export function calculateCodeChallengeReward(
  mode: "output_rush" | "debug_duel",
  isCorrect: boolean,
  remainingSeconds: number,
  nextStreak: number,
): { xpEarned: number; coinsEarned: number; multiplier: number } {
  if (!isCorrect) {
    return { xpEarned: 0, coinsEarned: 0, multiplier: 1 };
  }
  const multiplier = getStreakMultiplier(nextStreak);
  const baseXp = mode === "debug_duel" ? 65 : 50;
  const speedBonus = Math.max(0, Math.round(remainingSeconds)) * 3;
  const xpEarned = Math.round((baseXp + speedBonus) * multiplier);
  const coinsEarned = mode === "debug_duel" ? 18 : 14;
  return { xpEarned, coinsEarned, multiplier };
}

export function sanitizeQuestionsForStudent(
  questions: BankQuestion[],
): SanitizedExamQuestion[] {
  return questions.map((question) => {
    const {
      correctAnswer: _correctAnswer,
      explanationAr: _explanationAr,
      ...sanitized
    } = question;
    void _correctAnswer;
    void _explanationAr;
    return sanitized;
  });
}

export function selectRandomQuestionsForExam(
  bank: BankQuestion[],
  grade: GradeTier | "all",
  count: number,
): BankQuestion[] {
  const approved = bank.filter((q) => q.isApproved);
  const gradeMatched =
    grade === "all"
      ? approved
      : approved.filter((q) => q.grade === grade || q.grade === "all");

  const pool = [...gradeMatched];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.max(1, Math.min(count, pool.length)));
}

export function gradeExamAnswers(
  questions: BankQuestion[],
  answers: Record<string, string>,
  exam: Pick<ScheduledExam, "id" | "xpReward" | "coinsReward">,
): ExamGradingResult {
  const totalCount = questions.length;
  let correctCount = 0;

  const results: ExamQuestionResult[] = questions.map((q) => {
    const selectedAnswer = String(answers[String(q.id)] ?? "").trim();
    const isCorrect = selectedAnswer === q.correctAnswer.trim();
    if (isCorrect) {
      correctCount += 1;
    }
    return {
      questionId: q.id,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanationAr: q.explanationAr,
    };
  });

  const scorePercent =
    totalCount > 0
      ? Number(((correctCount / totalCount) * 100).toFixed(2))
      : 0;
  const ratio = totalCount > 0 ? correctCount / totalCount : 0;
  const xpAwarded = Math.round(exam.xpReward * ratio);
  const coinsAwarded = Math.round(exam.coinsReward * ratio);

  return {
    examId: exam.id,
    scorePercent,
    correctCount,
    totalCount,
    xpAwarded,
    coinsAwarded,
    submittedAt: new Date().toISOString(),
    results,
  };
}
