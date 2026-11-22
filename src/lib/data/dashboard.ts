import {
  createMockDashboardData,
  formatArabicUtcDate,
} from "@/lib/data/mock-dashboard";
import { getRankProgress } from "@/lib/gamification/ranks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbChallengeRow,
  DbDailyActivityRow,
  DbLessonProgressJoined,
  DbUserBadgeJoined,
  DbUserRow,
} from "@/types/database";
import type {
  BadgeItem,
  DashboardData,
  HeatmapDay,
  PlayerShellData,
  UserSession,
} from "@/types/gamification";

const DIFFICULTY_LABELS: Record<"easy" | "medium" | "hard", string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "تحدي متقدم",
};

const VALID_BADGE_ICONS = new Set<BadgeItem["iconName"]>([
  "Terminal",
  "Flame",
  "Bug",
  "Cpu",
  "Shield",
  "Zap",
]);

function buildLiveHeatmapGrid(rows: DbDailyActivityRow[], anchorDateIso: string): HeatmapDay[] {
  const byDate = new Map<string, DbDailyActivityRow>();
  for (const row of rows) {
    byDate.set(row.activity_date, row);
  }

  const anchorMs = Date.parse(`${anchorDateIso}T00:00:00.000Z`);
  const days: HeatmapDay[] = [];

  for (let offset = 111; offset >= 0; offset--) {
    const iso = new Date(anchorMs - offset * 86_400_000).toISOString().slice(0, 10);
    const match = byDate.get(iso);
    const rawLevel = match?.intensity_level ?? 0;
    const clampedLevel = (Math.min(4, Math.max(0, rawLevel)) as 0 | 1 | 2 | 3 | 4);

    days.push({
      date: iso,
      intensityLevel: clampedLevel,
      xpEarned: match?.xp_earned ?? 0,
      lessonsCompleted: match?.lessons_completed ?? 0,
      challengesSolved: match?.challenges_solved ?? 0,
      minutesStudied: match?.minutes_studied ?? 0,
      labelAr: formatArabicUtcDate(iso),
    });
  }

  return days;
}

export async function getProfileShellData(session: UserSession): Promise<PlayerShellData> {
  if (session.mode === "demo") {
    const mock = createMockDashboardData({
      userId: session.userId,
      fullName: session.fullName,
      email: session.email,
      grade: session.grade,
      role: session.role,
      avatarFrame: session.avatarFrame,
    });
    return {
      mode: "demo",
      profile: mock.profile,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("id, full_name, email, role, grade, xp, coins, streak, longest_streak, avatar_frame")
    .eq("id", session.userId)
    .maybeSingle<
      Pick<
        DbUserRow,
        | "id"
        | "full_name"
        | "email"
        | "role"
        | "grade"
        | "xp"
        | "coins"
        | "streak"
        | "longest_streak"
        | "avatar_frame"
      >
    >();

  const xp = userRow?.xp ?? 0;

  return {
    mode: "supabase",
    profile: {
      userId: session.userId,
      fullName: userRow?.full_name ?? session.fullName,
      email: userRow?.email ?? session.email,
      grade: userRow?.grade ?? session.grade,
      role: userRow?.role ?? session.role,
      xp,
      coins: userRow?.coins ?? 0,
      streak: userRow?.streak ?? 0,
      longestStreak: userRow?.longest_streak ?? 0,
      avatarFrame: userRow?.avatar_frame ?? session.avatarFrame,
      rank: getRankProgress(xp),
    },
  };
}

export async function getDashboardData(session: UserSession): Promise<DashboardData> {
  if (session.mode === "demo") {
    return createMockDashboardData({
      userId: session.userId,
      fullName: session.fullName,
      email: session.email,
      grade: session.grade,
      role: session.role,
      avatarFrame: session.avatarFrame,
    });
  }

  const supabase = await createSupabaseServerClient();
  const todayUtcIso = new Date().toISOString().slice(0, 10);
  const startWindowIso = new Date(Date.parse(`${todayUtcIso}T00:00:00.000Z`) - 111 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [userRes, badgesRes, activityRes, lessonProgressRes, challengeRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, full_name, email, phone, role, grade, xp, coins, streak, longest_streak, rank_tier, avatar_frame, avatar_url, stat_theory, stat_problem_solving, stat_code_speed, stat_consistency",
      )
      .eq("id", session.userId)
      .maybeSingle<DbUserRow>(),
    supabase
      .from("user_badges")
      .select("earned_at, badges(id, slug, title_ar, description_ar, icon_name, rarity, xp_reward)", {
        count: "exact",
      })
      .eq("user_id", session.userId)
      .order("earned_at", { ascending: false })
      .limit(3)
      .returns<DbUserBadgeJoined[]>(),
    supabase
      .from("daily_activity")
      .select("activity_date, xp_earned, lessons_completed, challenges_solved, minutes_studied, intensity_level")
      .eq("user_id", session.userId)
      .gte("activity_date", startWindowIso)
      .order("activity_date", { ascending: true })
      .returns<DbDailyActivityRow[]>(),
    supabase
      .from("lesson_progress")
      .select("progress_percent, lessons(slug, title_ar, duration_seconds, courses(title_ar))")
      .eq("user_id", session.userId)
      .order("last_accessed_at", { ascending: false })
      .limit(1)
      .maybeSingle<DbLessonProgressJoined>(),
    supabase
      .from("challenges")
      .select("slug, title_ar, description_ar, difficulty, language, starter_code, xp_reward, coins_reward")
      .eq("mode", "daily")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<DbChallengeRow>(),
  ]);

  const userRow = userRes.data;
  const xp = userRow?.xp ?? 0;
  const rank = getRankProgress(xp);

  const topBadges: BadgeItem[] = (badgesRes.data ?? [])
    .filter((entry): entry is DbUserBadgeJoined & { badges: NonNullable<DbUserBadgeJoined["badges"]> } =>
      Boolean(entry.badges),
    )
    .map((entry) => {
      const iconCandidate = entry.badges.icon_name as BadgeItem["iconName"];
      return {
        id: entry.badges.id,
        slug: entry.badges.slug,
        titleAr: entry.badges.title_ar,
        descriptionAr: entry.badges.description_ar,
        iconName: VALID_BADGE_ICONS.has(iconCandidate) ? iconCandidate : "Terminal",
        rarity: entry.badges.rarity,
        xpReward: entry.badges.xp_reward,
        earnedAt: entry.earned_at.slice(0, 10),
      };
    });

  const challenge = challengeRes.data;
  const lessonData = lessonProgressRes.data;

  return {
    mode: "supabase",
    profile: {
      userId: session.userId,
      fullName: userRow?.full_name ?? session.fullName,
      email: userRow?.email ?? session.email,
      grade: userRow?.grade ?? session.grade,
      role: userRow?.role ?? session.role,
      xp,
      coins: userRow?.coins ?? 0,
      streak: userRow?.streak ?? 0,
      longestStreak: userRow?.longest_streak ?? 0,
      avatarFrame: userRow?.avatar_frame ?? session.avatarFrame,
      rank,
    },
    stats: [
      { key: "theory", label: "النظري", value: userRow?.stat_theory ?? 0, accentHex: "#8B5CF6" },
      {
        key: "problem_solving",
        label: "حل المشكلات",
        value: userRow?.stat_problem_solving ?? 0,
        accentHex: "#06B6D4",
      },
      { key: "code_speed", label: "سرعة الكود", value: userRow?.stat_code_speed ?? 0, accentHex: "#EC4899" },
      { key: "consistency", label: "الالتزام", value: userRow?.stat_consistency ?? 0, accentHex: "#22D3EE" },
    ],
    heatmap: buildLiveHeatmapGrid(activityRes.data ?? [], todayUtcIso),
    topBadges,
    totalEarnedBadges: badgesRes.count ?? topBadges.length,
    dailyChallenge: challenge
      ? {
          slug: challenge.slug,
          titleAr: challenge.title_ar,
          descriptionAr: challenge.description_ar,
          difficultyAr: DIFFICULTY_LABELS[challenge.difficulty],
          language: challenge.language,
          xpReward: challenge.xp_reward,
          coinsReward: challenge.coins_reward,
          codePreview: challenge.starter_code,
        }
      : {
          slug: "daily-starter",
          titleAr: "تحدي البداية السريعة",
          descriptionAr: "جهّز بيئتك واكتب أول حلقة تكرار في Python.",
          difficultyAr: "سهل",
          language: "Python",
          xpReward: 100,
          coinsReward: 25,
          codePreview: 'print("Ready in CodeVerse!")',
        },
    playgroundPreviewCode:
      challenge?.starter_code ||
      `def welcome(name):\n    return f"أهلاً يا {name} في CodeVerse"\n\nprint(welcome("مبرمج"))`,
    lastLesson: lessonData?.lessons
      ? {
          courseTitleAr: lessonData.lessons.courses?.title_ar ?? "مسار البرمجة",
          lessonTitleAr: lessonData.lessons.title_ar,
          progressPercent: lessonData.progress_percent,
          durationLabelAr: `${Math.max(1, Math.round(lessonData.lessons.duration_seconds / 60))} دقيقة`,
          href: "/courses",
        }
      : null,
  };
}
