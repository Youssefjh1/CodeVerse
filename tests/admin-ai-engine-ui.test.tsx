import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiEngineStudio } from "@/components/admin/ai-engine-studio";
import type { BankQuestion, ScheduledExam } from "@/types/arena";

afterEach(() => {
  vi.restoreAllMocks();
});

const INITIAL_QUESTIONS: BankQuestion[] = [
  {
    id: 1,
    grade: "grade_11",
    topic: "الخوارزميات",
    questionType: "mcq",
    promptAr: "سؤال تمهيدي معتمد",
    codeSnippet: null,
    language: "python",
    options: ["أ", "ب"],
    correctAnswer: "أ",
    explanationAr: "توضيح",
    difficulty: "easy",
    sourcePdfName: "seed.pdf",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-22T00:00:00.000Z",
  },
];

const INITIAL_EXAMS: ScheduledExam[] = [];

describe("Admin AI Exam Engine Studio UI", () => {
  it("generates structured questions + cheat sheet, edits and approves a question, and schedules an exam", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    fetchSpy.mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/ai-engine/generate") {
        return new Response(
          JSON.stringify({
            provider: "demo",
            modelUsed: "demo-grounded-extractor",
            sourceName: "نص منهج مباشر",
            questions: [
              {
                draftId: "draft-1",
                grade: "grade_11",
                topic: "البحث الثنائي",
                questionType: "mcq",
                promptAr: "سؤال مولد قابل للتعديل",
                codeSnippet: null,
                language: "python",
                options: ["O(log n)", "O(n)", "O(1)", "O(n^2)"],
                correctAnswer: "O(log n)",
                explanationAr: "شرح الإجابة",
                difficulty: "medium",
                sourcePdfName: "نص منهج مباشر",
              },
            ],
            cheatSheet: {
              titleAr: "ورقة المراجعة السريعة: البحث الثنائي",
              summaryAr: "ملخص مركز للدرس",
              keyTerms: [{ term: "Binary Search", definitionAr: "بحث ثنائي" }],
              sections: [
                {
                  headingAr: "أهم النقاط",
                  bulletsAr: ["يشترط الترتيب"],
                  codeExample: "mid = (low + high) // 2",
                },
              ],
            },
          }),
          { status: 200 },
        );
      }

      if (url === "/api/admin/questions") {
        return new Response(
          JSON.stringify({
            questions: [
              {
                id: 500,
                grade: "grade_11",
                topic: "البحث الثنائي",
                questionType: "mcq",
                promptAr: "سؤال معدل بعد المراجعة",
                codeSnippet: null,
                language: "python",
                options: ["O(log n)", "O(n)", "O(1)", "O(n^2)"],
                correctAnswer: "O(log n)",
                explanationAr: "شرح الإجابة",
                difficulty: "medium",
                sourcePdfName: "نص منهج مباشر",
                aiGenerated: true,
                isApproved: true,
                createdAt: "2026-11-22T00:00:00.000Z",
              },
            ],
          }),
          { status: 201 },
        );
      }

      if (url === "/api/admin/exams") {
        return new Response(
          JSON.stringify({
            exam: {
              id: 88,
              titleAr: "اختبار أسبوعي عشوائي — مراجعة شاملة",
              grade: "grade_11",
              examCadence: "weekly",
              questionIds: [1, 500],
              questionCount: 2,
              durationMinutes: 15,
              xpReward: 250,
              coinsReward: 75,
              startsAt: null,
              endsAt: null,
              isPublished: true,
              createdAt: "2026-11-22T00:00:00.000Z",
            },
          }),
          { status: 201 },
        );
      }

      return new Response("{}", { status: 404 });
    });

    render(
      <AiEngineStudio
        initialQuestions={INITIAL_QUESTIONS}
        initialExams={INITIAL_EXAMS}
      />,
    );

    expect(screen.getByTestId("bank-count")).toHaveTextContent("1");

    // Load sample curriculum & generate
    fireEvent.click(screen.getByRole("button", { name: /تحميل مثال منهج تانية ثانوي/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /توليد الأسئلة وورقة المراجعة/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("cheat-sheet-viewer")).toBeInTheDocument();
      expect(screen.getByTestId("approval-queue")).toBeInTheDocument();
    });

    // Edit question text inline inside Approval Queue & approve
    const promptTextarea = screen.getByDisplayValue("سؤال مولد قابل للتعديل");
    fireEvent.change(promptTextarea, {
      target: { value: "سؤال معدل بعد المراجعة" },
    });

    fireEvent.click(screen.getByRole("button", { name: "اعتماد وحفظ" }));

    await waitFor(() => {
      expect(screen.getByTestId("bank-count")).toHaveTextContent("2");
    });

    // Schedule randomized exam
    fireEvent.click(
      screen.getByRole("button", { name: /إنشاء وجدولة الامتحان/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("scheduled-exam-88")).toBeInTheDocument();
    });
  });
});
