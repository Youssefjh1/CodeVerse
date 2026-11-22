import type { GradeTier, RankDefinition, RankProgress } from "@/types/gamification";

export const GRADE_LABELS: Record<GradeTier, string> = {
  grade_10: "أولى ثانوي",
  grade_11: "تانية ثانوي",
  other: "صفوف أخرى",
};

export const RANK_TIERS: readonly RankDefinition[] = [
  {
    id: "newbie",
    titleAr: "مبتدئ كود",
    subtitleAr: "بداية الرحلة في عالم البرمجة",
    minXp: 0,
    accentHex: "#9CA3C4",
  },
  {
    id: "bug_hunter",
    titleAr: "صياد الأخطاء",
    subtitleAr: "بتلقط الـ Bugs قبل ما تهرب",
    minXp: 1000,
    accentHex: "#06B6D4",
  },
  {
    id: "code_ninja",
    titleAr: "نينجا البرمجة",
    subtitleAr: "سرعة ودقة في كتابة الخوارزميات",
    minXp: 2500,
    accentHex: "#8B5CF6",
  },
  {
    id: "cyber_architect",
    titleAr: "مهندس سايبر",
    subtitleAr: "تصميم حلول وهياكل بيانات احترافية",
    minXp: 4000,
    accentHex: "#EC4899",
  },
  {
    id: "grandmaster",
    titleAr: "جراند ماستر",
    subtitleAr: "نخبة مبرمجي CodeVerse",
    minXp: 7000,
    accentHex: "#F59E0B",
  },
] as const;

function sanitizeXp(xp: number): number {
  if (!Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
}

export function getRankForXp(xp: number): RankDefinition {
  const safeXp = sanitizeXp(xp);
  let matched = RANK_TIERS[0];

  for (const tier of RANK_TIERS) {
    if (safeXp >= tier.minXp) {
      matched = tier;
    }
  }

  return matched;
}

export function getRankProgress(xp: number): RankProgress {
  const safeXp = sanitizeXp(xp);
  const current = getRankForXp(safeXp);
  const currentIndex = RANK_TIERS.findIndex((tier) => tier.id === current.id);
  const next = currentIndex >= 0 && currentIndex < RANK_TIERS.length - 1
    ? RANK_TIERS[currentIndex + 1]
    : null;

  if (!next) {
    return {
      current,
      next: null,
      progressPercent: 100,
      xpIntoCurrentTier: safeXp - current.minXp,
      xpToNext: 0,
      isMaxRank: true,
    };
  }

  const tierSpan = Math.max(1, next.minXp - current.minXp);
  const xpIntoCurrentTier = Math.max(0, safeXp - current.minXp);
  const xpToNext = Math.max(0, next.minXp - safeXp);
  const rawPercent = Math.round((xpIntoCurrentTier / tierSpan) * 100);
  const progressPercent = Math.min(100, Math.max(0, rawPercent));

  return {
    current,
    next,
    progressPercent,
    xpIntoCurrentTier,
    xpToNext,
    isMaxRank: false,
  };
}
