import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { PlayerStatsCard } from "@/components/dashboard/player-stats-card";
import { QuickLaunchCards } from "@/components/dashboard/quick-launch-cards";
import { TrophyShowcase } from "@/components/dashboard/trophy-showcase";
import { updateAvatarFrameAction } from "@/lib/auth/actions";
import { createMockDashboardData } from "@/lib/data/mock-dashboard";

vi.mock("@/lib/auth/actions", () => ({
  updateAvatarFrameAction: vi.fn(async () => ({ ok: true })),
}));

beforeEach(() => {
  vi.mocked(updateAvatarFrameAction).mockResolvedValue({ ok: true });
});

describe("Student Gamer Dashboard components", () => {
  it("renders PlayerStatsCard with Arabic stats, radar SVG, and interactive frame switcher", async () => {
    const data = createMockDashboardData();
    render(<PlayerStatsCard profile={data.profile} stats={data.stats} />);

    expect(screen.getByText("يوسف طارق")).toBeInTheDocument();
    expect(screen.getByText("تانية ثانوي")).toBeInTheDocument();
    expect(screen.getByText("نينجا البرمجة")).toBeInTheDocument();
    expect(screen.getAllByText("النظري").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("حل المشكلات").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("سرعة الكود").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("الالتزام").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("مخطط مهارات اللاعب")).toBeInTheDocument();

    const cyanFrameBtn = screen.getByRole("button", { name: /سايبر سيان/i });
    fireEvent.click(cyanFrameBtn);
    expect(cyanFrameBtn).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/تم تحديث إطار الأفاتار/i)).toBeInTheDocument();
  });

  it("reverts optimistic avatar frame and shows alert when updateAvatarFrameAction fails", async () => {
    vi.mocked(updateAvatarFrameAction).mockResolvedValueOnce({
      ok: false,
      error: "تعذر حفظ إطار الأفاتار",
    });

    const data = createMockDashboardData({ avatarFrame: "electric_violet" });
    render(<PlayerStatsCard profile={data.profile} stats={data.stats} />);

    const violetBtn = screen.getByRole("button", { name: /بنفسجي مشحون/i });
    const cyanBtn = screen.getByRole("button", { name: /سايبر سيان/i });
    expect(violetBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(cyanBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("تعذر حفظ إطار الأفاتار");
    });
    expect(violetBtn).toHaveAttribute("aria-pressed", "true");
    expect(cyanBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("renders 112 ActivityHeatmap cells and shows Arabic tooltip details on focus/hover", () => {
    const data = createMockDashboardData();
    render(<ActivityHeatmap days={data.heatmap} currentStreak={data.profile.streak} />);

    const cells = screen.getAllByTestId("heatmap-day");
    expect(cells).toHaveLength(112);

    fireEvent.mouseEnter(cells[111]);
    expect(screen.getByTestId("heatmap-tooltip")).toHaveTextContent(data.heatmap[111].labelAr);
    expect(screen.getByTestId("heatmap-tooltip")).toHaveTextContent("XP");
  });

  it("renders TrophyShowcase badges and handles empty state for new Live Supabase users", () => {
    const data = createMockDashboardData();
    const { rerender } = render(
      <TrophyShowcase
        badges={data.topBadges}
        totalEarned={data.totalEarnedBadges}
        rank={data.profile.rank}
        xp={data.profile.xp}
      />,
    );

    expect(screen.getByText("قناص البجز")).toBeInTheDocument();
    expect(screen.getByText("شعلة الأسبوع")).toBeInTheDocument();
    expect(screen.getByText("أول سطر كود")).toBeInTheDocument();

    rerender(
      <TrophyShowcase
        badges={[]}
        totalEarned={0}
        rank={data.profile.rank}
        xp={0}
      />,
    );

    expect(screen.getByText(/لسه ما جمعتش أوسمة/i)).toBeInTheDocument();
  });

  it("renders QuickLaunchCards with dir='ltr' on code blocks and graceful null lastLesson fallback", () => {
    const data = createMockDashboardData();
    const { rerender } = render(
      <QuickLaunchCards
        dailyChallenge={data.dailyChallenge}
        playgroundPreviewCode={data.playgroundPreviewCode}
        lastLesson={data.lastLesson}
      />,
    );

    expect(screen.getByText("تحدي اليوم")).toBeInTheDocument();
    expect(screen.getByText("محرر الكود التفاعلي")).toBeInTheDocument();
    expect(screen.getByText("آخر درس")).toBeInTheDocument();
    expect(screen.getByText("68%")).toBeInTheDocument();

    const ltrCodeBlocks = screen.getAllByTestId("ltr-code-preview");
    expect(ltrCodeBlocks.length).toBeGreaterThanOrEqual(1);
    for (const block of ltrCodeBlocks) {
      expect(block).toHaveAttribute("dir", "ltr");
    }

    rerender(
      <QuickLaunchCards
        dailyChallenge={data.dailyChallenge}
        playgroundPreviewCode={data.playgroundPreviewCode}
        lastLesson={null}
      />,
    );

    expect(screen.getByText(/ابدأ أول درس ليك/i)).toBeInTheDocument();
  });
});
