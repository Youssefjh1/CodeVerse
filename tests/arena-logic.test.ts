import { describe, expect, it } from "vitest";
import {
  calculateCodeChallengeReward,
  calculateFactOrCapReward,
  getStreakMultiplier,
  gradeExamAnswers,
  sanitizeQuestionsForStudent,
  selectRandomQuestionsForExam,
} from "@/lib/arena/scoring";
import type { BankQuestion } from "@/types/arena";

const SAMPLE_BANK: BankQuestion[] = [
  {
    id: 1,
    grade: "grade_10",
    topic: "بايثون",
    questionType: "mcq",
    promptAr: "ما ناتج 2 ** 3 في Python؟",
    codeSnippet: "print(2 ** 3)",
    language: "python",
    options: ["6", "8", "9", "5"],
    correctAnswer: "8",
    explanationAr: "المعامل ** يرفع للأس، و2 أس 3 يساوي 8.",
    difficulty: "easy",
    sourcePdfName: "unit1.pdf",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: 2,
    grade: "grade_11",
    topic: "خوارزميات",
    questionType: "fact_or_cap",
    promptAr: "البحث الثنائي يتطلب ترتيب العناصر أولاً.",
    codeSnippet: null,
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "البحث الثنائي يعتمد على الترتيب.",
    difficulty: "medium",
    sourcePdfName: "unit2.pdf",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: 3,
    grade: "grade_11",
    topic: "مقترح غير معتمد",
    questionType: "mcq",
    promptAr: "سؤال قيد المراجعة",
    codeSnippet: null,
    language: "python",
    options: ["أ", "ب"],
    correctAnswer: "أ",
    explanationAr: "تجربة",
    difficulty: "easy",
    sourcePdfName: null,
    aiGenerated: true,
    isApproved: false,
    createdAt: "2026-11-20T00:00:00.000Z",
  },
];

describe("Arena scoring, sanitization, and exam grading logic", () => {
  it("computes streak multipliers and rapid-fire rewards accurately", () => {
    expect(getStreakMultiplier(0)).toBe(1);
    expect(getStreakMultiplier(1)).toBe(1);
    expect(getStreakMultiplier(2)).toBe(1.5);
    expect(getStreakMultiplier(3)).toBe(2);
    expect(getStreakMultiplier(5)).toBe(3);

    const wrong = calculateFactOrCapReward(false, 8, 0);
    expect(wrong.xpEarned).toBe(0);

    const fastStreak = calculateFactOrCapReward(true, 9, 3);
    // (35 + 36) * 2 = 142
    expect(fastStreak.xpEarned).toBe(142);
    expect(fastStreak.multiplier).toBe(2);

    const debugReward = calculateCodeChallengeReward("debug_duel", true, 10, 2);
    // (65 + 30) * 1.5 = 142.5 -> 143
    expect(debugReward.xpEarned).toBe(143);
  });

  it("strips correctAnswer and explanationAr from student-facing exam questions", () => {
    const sanitized = sanitizeQuestionsForStudent(SAMPLE_BANK);
    expect(sanitized).toHaveLength(3);
    for (const q of sanitized) {
      expect("correctAnswer" in q).toBe(false);
      expect("explanationAr" in q).toBe(false);
      expect(q.promptAr.length).toBeGreaterThan(0);
    }
  });

  it("selects only approved grade-matched questions for randomized exams", () => {
    const selectedG11 = selectRandomQuestionsForExam(SAMPLE_BANK, "grade_11", 5);
    expect(selectedG11).toHaveLength(1);
    expect(selectedG11[0].id).toBe(2);
  });

  it("auto-grades exam answers and computes proportional XP and coins", () => {
    const gradeResult = gradeExamAnswers(
      SAMPLE_BANK.slice(0, 2),
      { "1": "8", "2": "هبد" },
      { id: 1, xpReward: 200, coinsReward: 60 },
    );

    expect(gradeResult.correctCount).toBe(1);
    expect(gradeResult.totalCount).toBe(2);
    expect(gradeResult.scorePercent).toBe(50);
    expect(gradeResult.xpAwarded).toBe(100);
    expect(gradeResult.coinsAwarded).toBe(30);
    expect(gradeResult.results[0].isCorrect).toBe(true);
    expect(gradeResult.results[1].isCorrect).toBe(false);
  });
});
