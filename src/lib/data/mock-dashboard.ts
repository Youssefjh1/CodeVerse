import { getRankProgress } from "@/lib/gamification/ranks";
import type {
  AvatarFrameId,
  DashboardData,
  GradeTier,
  HeatmapDay,
  UserRole,
} from "@/types/gamification";

export const MOCK_ANCHOR_DATE = "2026-11-22";

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export function formatArabicUtcDate(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);
  const monthName = ARABIC_MONTHS[monthIndex] ?? "نوفمبر";
  return `${day} ${monthName} ${year}`;
}

export function generateDeterministicHeatmap(anchorDateIso: string = MOCK_ANCHOR_DATE): HeatmapDay[] {
  const anchorMs = Date.parse(`${anchorDateIso}T00:00:00.000Z`);
  const safeAnchorMs = Number.isNaN(anchorMs)
    ? Date.parse(`${MOCK_ANCHOR_DATE}T00:00:00.000Z`)
    : anchorMs;

  const totalDays = 112; // 16 weeks x 7 days
  const days: HeatmapDay[] = [];

  for (let offset = totalDays - 1; offset >= 0; offset--) {
    const dayDate = new Date(safeAnchorMs - offset * 86_400_000);
    const iso = dayDate.toISOString().slice(0, 10);
    const dayIndex = totalDays - 1 - offset;

    // Keep the most recent 14 days continuously active to match the 14-day streak.
    let intensityLevel: 0 | 1 | 2 | 3 | 4;
    if (offset < 14) {
      const recentLevels: ReadonlyArray<1 | 2 | 3 | 4> = [2, 3, 4, 2, 3, 4, 3, 2, 4, 3, 2, 3, 4, 4];
      intensityLevel = recentLevels[13 - offset];
    } else {
      const hash = (dayIndex * 37 + 13) % 19;
      if (hash < 5) intensityLevel = 0;
      else if (hash < 9) intensityLevel = 1;
      else if (hash < 13) intensityLevel = 2;
      else if (hash < 17) intensityLevel = 3;
      else intensityLevel = 4;
    }

    const xpEarned = intensityLevel === 0 ? 0 : intensityLevel * 65 + ((dayIndex * 11) % 35);
    const lessonsCompleted = intensityLevel >= 2 ? 1 + (dayIndex % 2) : intensityLevel === 1 ? 1 : 0;
    const challengesSolved = intensityLevel >= 3 ? 1 + (dayIndex % 3) : intensityLevel === 2 ? 1 : 0;
    const minutesStudied = intensityLevel === 0 ? 0 : intensityLevel * 18 + (dayIndex % 15);

    days.push({
      date: iso,
      intensityLevel,
      xpEarned,
      lessonsCompleted,
      challengesSolved,
      minutesStudied,
      labelAr: formatArabicUtcDate(iso),
    });
  }

  return days;
}

export interface MockDashboardOverrides {
  userId?: string;
  fullName?: string;
  email?: string;
  grade?: GradeTier;
  role?: UserRole;
  avatarFrame?: AvatarFrameId;
}

export function createMockDashboardData(overrides: MockDashboardOverrides = {}): DashboardData {
  const xp = 3450;
  const grade = overrides.grade ?? "grade_11";
  const role = overrides.role ?? "student";
  const avatarFrame = overrides.avatarFrame ?? "electric_violet";

  return {
    mode: "demo",
    profile: {
      userId: overrides.userId ?? "demo-student-01",
      fullName: overrides.fullName ?? "يوسف طارق",
      email: overrides.email ?? "youssef.demo@codeverse.eg",
      grade,
      role,
      xp,
      coins: 1280,
      streak: 14,
      longestStreak: 21,
      avatarFrame,
      rank: getRankProgress(xp),
    },
    stats: [
      { key: "theory", label: "النظري", value: 78, accentHex: "#8B5CF6" },
      { key: "problem_solving", label: "حل المشكلات", value: 86, accentHex: "#06B6D4" },
      { key: "code_speed", label: "سرعة الكود", value: 72, accentHex: "#EC4899" },
      { key: "consistency", label: "الالتزام", value: 91, accentHex: "#22D3EE" },
    ],
    heatmap: generateDeterministicHeatmap(MOCK_ANCHOR_DATE),
    totalEarnedBadges: 6,
    topBadges: [
      {
        id: 1,
        slug: "bug-slayer",
        titleAr: "قناص البجز",
        descriptionAr: "أصلحت 15 خطأ برمجي في ساحة التحديات بدون أي تلميحات.",
        iconName: "Bug",
        rarity: "epic",
        xpReward: 500,
        earnedAt: "2026-11-18",
      },
      {
        id: 2,
        slug: "streak-7",
        titleAr: "شعلة الأسبوع",
        descriptionAr: "حافظت على سلسلة مذاكرة متواصلة لمدة 7 أيام كاملة.",
        iconName: "Flame",
        rarity: "rare",
        xpReward: 250,
        earnedAt: "2026-11-15",
      },
      {
        id: 3,
        slug: "first-commit",
        titleAr: "أول سطر كود",
        descriptionAr: "شغّلت أول خوارزمية في محرر CodeVerse بنجاح.",
        iconName: "Terminal",
        rarity: "common",
        xpReward: 100,
        earnedAt: "2026-10-30",
      },
    ],
    dailyChallenge: {
      slug: "daily-even-sum",
      titleAr: "مجموع الأرقام الزوجية",
      descriptionAr: "صفّي المصفوفة واجمع الأعداد الزوجية في أسرع وقت.",
      difficultyAr: "سهل",
      language: "Python",
      xpReward: 150,
      coinsReward: 40,
      codePreview: `def sum_evens(nums):\n    return sum(n for n in nums if n % 2 == 0)\n\nprint(sum_evens([2, 5, 8, 11, 14]))  # 24`,
    },
    playgroundPreviewCode: `def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        low = mid + 1 if arr[mid] < target else low\n        high = mid - 1 if arr[mid] > target else high\n    return -1`,
    lastLesson: {
      courseTitleAr: "الخوارزميات وهياكل البيانات (تانية ثانوي)",
      lessonTitleAr: "البحث الثنائي Binary Search بالرسم",
      progressPercent: 68,
      durationLabelAr: "باقي 7 دقائق",
      href: "/courses",
    },
  };
}
