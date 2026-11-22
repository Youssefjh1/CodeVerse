import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArenaHub } from "@/components/arena/arena-hub";
import { getArenaBootstrapData } from "@/lib/data/phase3-store";

afterEach(() => {
  vi.restoreAllMocks();
});

async function buildBootstrap() {
  return getArenaBootstrapData({
    mode: "demo",
    userId: "demo-student-1",
    fullName: "يوسف طارق",
    email: "youssef@codeverse.eg",
    grade: "grade_11",
    role: "student",
    avatarFrame: "electric_violet",
  });
}

describe("Challenge Arena UI", () => {
  it("plays Fact or Cap with 10s timer, streak multiplier, XP updates, and switches leaderboards", async () => {
    const initialData = await buildBootstrap();
    render(<ArenaHub initialData={initialData} />);

    expect(screen.getByTestId("foc-timer")).toHaveTextContent("10s");
    expect(screen.getByTestId("arena-session-xp")).toHaveTextContent("+0 XP");

    // First Fact or Cap item in seed has correctAnswer = "حقيقة"
    fireEvent.click(screen.getByRole("button", { name: /حقيقة/i }));

    expect(screen.getByTestId("foc-feedback")).toBeInTheDocument();
    expect(screen.getByTestId("arena-session-xp").textContent).not.toBe("+0 XP");

    // Leaderboard grade switcher & Weekly / Season tabs
    const grade10Btn = screen.getByRole("button", { name: "أولى ثانوي" });
    fireEvent.click(grade10Btn);
    expect(grade10Btn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("leaderboard-list")).toHaveTextContent("مريم خالد");

    const seasonTab = screen.getByRole("tab", { name: /تصنيف الموسم/i });
    fireEvent.click(seasonTab);
    expect(seasonTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to Output Rush, Debug Duel, 1v1 Flash Blitz, and submits a Scheduled Exam", async () => {
    const initialData = await buildBootstrap();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    fetchSpy.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/submit")) {
        return new Response(
          JSON.stringify({
            examId: 1,
            scorePercent: 100,
            correctCount: 1,
            totalCount: 1,
            xpAwarded: 250,
            coinsAwarded: 75,
            submittedAt: "2026-11-22T12:00:00.000Z",
            results: [
              {
                questionId: 104,
                selectedAnswer: "هبد",
                correctAnswer: "هبد",
                isCorrect: true,
                explanationAr: "التفسير",
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          exam: initialData.scheduledExams[0],
          questions: [
            {
              id: 104,
              grade: "grade_11",
              topic: "الخوارزميات",
              questionType: "fact_or_cap",
              promptAr: "البحث الثنائي يعمل بدون ترتيب.",
              codeSnippet: null,
              language: "pseudocode",
              options: ["حقيقة", "هبد"],
              difficulty: "medium",
              sourcePdfName: "exam.pdf",
              aiGenerated: false,
              isApproved: true,
              createdAt: "2026-11-22T00:00:00.000Z",
            },
          ],
        }),
        { status: 200 },
      );
    });

    render(<ArenaHub initialData={initialData} />);

    // Output Rush
    fireEvent.click(screen.getByRole("tab", { name: /Output Rush/i }));
    expect(screen.getByTestId("arena-code-block")).toHaveAttribute("dir", "ltr");

    // Debug Duel
    fireEvent.click(screen.getByRole("tab", { name: /Debug Duel/i }));
    expect(screen.getByTestId("arena-code-block")).toHaveAttribute("dir", "ltr");

    // 1v1 Flash Blitz Lobby
    fireEvent.click(screen.getByRole("tab", { name: /1v1 Flash Blitz/i }));
    expect(screen.getByRole("button", { name: /ابحث عن منافس الآن/i })).toBeInTheDocument();

    // Scheduled Exams
    fireEvent.click(screen.getByRole("tab", { name: /الامتحانات المجدولة/i }));
    const startBtns = screen.getAllByRole("button", { name: /ابدأ الامتحان/i });
    fireEvent.click(startBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId("exam-countdown")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "هبد" }));
    fireEvent.click(screen.getByRole("button", { name: /تسليم الامتحان/i }));

    await waitFor(() => {
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });
});
