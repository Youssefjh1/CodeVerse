import { describe, expect, it } from "vitest";
import { createMockDashboardData, generateDeterministicHeatmap } from "@/lib/data/mock-dashboard";

describe("Deterministic activity heatmap and mock dashboard seed", () => {
  it("generates exactly 112 deterministic days with valid intensity levels 0..4", () => {
    const first = generateDeterministicHeatmap("2026-11-22");
    const second = generateDeterministicHeatmap("2026-11-22");

    expect(first).toHaveLength(112);
    expect(first).toEqual(second);

    for (const day of first) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(day.intensityLevel).toBeGreaterThanOrEqual(0);
      expect(day.intensityLevel).toBeLessThanOrEqual(4);
      expect(Number.isInteger(day.intensityLevel)).toBe(true);
      expect(day.xpEarned).toBeGreaterThanOrEqual(0);
      expect(day.labelAr.length).toBeGreaterThan(3);
    }
  });

  it("produces realistic Egyptian Gen Z student dashboard data and applies overrides", () => {
    const data = createMockDashboardData({
      grade: "grade_10",
      role: "admin",
      avatarFrame: "cyber_cyan",
    });

    expect(data.profile.grade).toBe("grade_10");
    expect(data.profile.role).toBe("admin");
    expect(data.profile.avatarFrame).toBe("cyber_cyan");
    expect(data.profile.xp).toBeGreaterThanOrEqual(3000);
    expect(data.stats).toHaveLength(4);
    expect(data.stats.map((item) => item.label)).toEqual([
      "النظري",
      "حل المشكلات",
      "سرعة الكود",
      "الالتزام",
    ]);
    expect(data.topBadges).toHaveLength(3);
    expect(data.dailyChallenge.codePreview.length).toBeGreaterThan(10);
    expect(data.lastLesson).not.toBeNull();
  });
});
