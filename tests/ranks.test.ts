import { describe, expect, it } from "vitest";
import { AVATAR_FRAMES } from "@/lib/gamification/frames";
import { getRankForXp, getRankProgress, GRADE_LABELS, RANK_TIERS } from "@/lib/gamification/ranks";

describe("CodeVerse rank progression and metadata", () => {
  it("defines 5 ordered rank tiers and 3 Egyptian grade labels", () => {
    expect(RANK_TIERS.map((tier) => tier.id)).toEqual([
      "newbie",
      "bug_hunter",
      "code_ninja",
      "cyber_architect",
      "grandmaster",
    ]);
    expect(GRADE_LABELS).toEqual({
      grade_10: "أولى ثانوي",
      grade_11: "تانية ثانوي",
      other: "صفوف أخرى",
    });
  });

  it("maps boundary XP values to exact rank tiers", () => {
    expect(getRankForXp(0).id).toBe("newbie");
    expect(getRankForXp(999).id).toBe("newbie");
    expect(getRankForXp(1000).id).toBe("bug_hunter");
    expect(getRankForXp(2499).id).toBe("bug_hunter");
    expect(getRankForXp(2500).id).toBe("code_ninja");
    expect(getRankForXp(3999).id).toBe("code_ninja");
    expect(getRankForXp(4000).id).toBe("cyber_architect");
    expect(getRankForXp(6999).id).toBe("cyber_architect");
    expect(getRankForXp(7000).id).toBe("grandmaster");
  });

  it("clamps negative XP safely without NaN or negative percentages", () => {
    const progress = getRankProgress(-50);
    expect(progress.current.id).toBe("newbie");
    expect(progress.next?.id).toBe("bug_hunter");
    expect(progress.progressPercent).toBe(0);
    expect(progress.xpIntoCurrentTier).toBe(0);
    expect(progress.xpToNext).toBe(1000);
    expect(progress.isMaxRank).toBe(false);
    expect(Number.isNaN(progress.progressPercent)).toBe(false);
  });

  it("computes mid-tier progress accurately for Code Ninja (3,450 XP)", () => {
    const progress = getRankProgress(3450);
    expect(progress.current.id).toBe("code_ninja");
    expect(progress.next?.id).toBe("cyber_architect");
    expect(progress.xpIntoCurrentTier).toBe(950);
    expect(progress.xpToNext).toBe(550);
    expect(progress.progressPercent).toBe(63);
    expect(progress.isMaxRank).toBe(false);
  });

  it("handles Grandmaster overflow XP safely without null dereference", () => {
    const progress = getRankProgress(999999);
    expect(progress.current.id).toBe("grandmaster");
    expect(progress.next).toBeNull();
    expect(progress.progressPercent).toBe(100);
    expect(progress.xpToNext).toBe(0);
    expect(progress.isMaxRank).toBe(true);
  });

  it("provides all 5 customizable neon avatar frames", () => {
    expect(AVATAR_FRAMES.map((frame) => frame.id)).toEqual([
      "obsidian_edge",
      "electric_violet",
      "cyber_cyan",
      "hot_pink",
      "solar_glitch",
    ]);
  });
});
