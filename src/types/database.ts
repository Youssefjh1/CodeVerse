import type { AvatarFrameId, BadgeRarity, GradeTier, RankTierId, UserRole } from "./gamification";

export interface DbUserRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  grade: GradeTier;
  xp: number;
  coins: number;
  streak: number;
  longest_streak: number;
  rank_tier: RankTierId;
  avatar_frame: AvatarFrameId;
  avatar_url: string | null;
  stat_theory: number;
  stat_problem_solving: number;
  stat_code_speed: number;
  stat_consistency: number;
}

export interface DbUserBadgeJoined {
  earned_at: string;
  badges: {
    id: number;
    slug: string;
    title_ar: string;
    description_ar: string;
    icon_name: string;
    rarity: BadgeRarity;
    xp_reward: number;
  } | null;
}

export interface DbDailyActivityRow {
  activity_date: string;
  xp_earned: number;
  lessons_completed: number;
  challenges_solved: number;
  minutes_studied: number;
  intensity_level: 0 | 1 | 2 | 3 | 4;
}

export interface DbLessonProgressJoined {
  progress_percent: number;
  lessons: {
    slug: string;
    title_ar: string;
    duration_seconds: number;
    courses: {
      title_ar: string;
    } | null;
  } | null;
}

export interface DbChallengeRow {
  slug: string;
  title_ar: string;
  description_ar: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  starter_code: string;
  xp_reward: number;
  coins_reward: number;
}
