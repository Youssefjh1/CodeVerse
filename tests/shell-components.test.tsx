import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileHud } from "@/components/layout/mobile-hud";
import { ShellControls } from "@/components/layout/shell-controls";
import {
  signOutAction,
  switchDemoRoleAction,
  updateGradeAction,
} from "@/lib/auth/actions";
import { createMockDashboardData } from "@/lib/data/mock-dashboard";
import { getProfileShellData } from "@/lib/data/dashboard";

vi.mock("@/lib/auth/actions", () => ({
  signOutAction: vi.fn(async () => {}),
  switchDemoRoleAction: vi.fn(async () => ({ ok: true })),
  updateGradeAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

beforeEach(() => {
  vi.mocked(switchDemoRoleAction).mockResolvedValue({ ok: true });
  vi.mocked(updateGradeAction).mockResolvedValue({ ok: true });
  void signOutAction;
});

describe("Navigation shell payload optimization and mobile controls", () => {
  it("builds lightweight PlayerShellData without heatmap or badge arrays", async () => {
    const shell = await getProfileShellData({
      mode: "demo",
      userId: "demo-01",
      fullName: "يوسف طارق",
      email: "youssef@codeverse.eg",
      grade: "grade_11",
      role: "student",
      avatarFrame: "electric_violet",
    });

    expect(shell.mode).toBe("demo");
    expect(shell.profile.fullName).toBe("يوسف طارق");
    expect("heatmap" in shell).toBe(false);
    expect("topBadges" in shell).toBe(false);
  });

  it("exposes grade switcher, demo role toggle, and live sign-out inside MobileHud drawer", () => {
    const mock = createMockDashboardData();
    const { rerender } = render(
      <MobileHud data={{ mode: "demo", profile: mock.profile }} />,
    );

    const toggleBtn = screen.getByRole("button", { name: /خيارات الحساب والصف/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole("button", { name: "أولى ثانوي" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /معاينة لوحة الإدارة/i })).toBeInTheDocument();

    rerender(
      <MobileHud
        data={{
          mode: "supabase",
          profile: { ...mock.profile, role: "student" },
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /تسجيل الخروج/i })).toBeInTheDocument();
  });

  it("displays Arabic error feedback when ShellControls actions fail", async () => {
    vi.mocked(updateGradeAction).mockResolvedValueOnce({
      ok: false,
      error: "تعذر تحديث الصف الدراسي.",
    });

    const mock = createMockDashboardData();
    render(<ShellControls mode="demo" profile={mock.profile} />);

    fireEvent.click(screen.getByRole("button", { name: "أولى ثانوي" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("تعذر تحديث الصف الدراسي.");
    });
  });
});
