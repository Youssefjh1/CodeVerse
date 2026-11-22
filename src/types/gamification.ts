export type UserRole = "student" | "admin";

export type GradeTier = "grade_10" | "grade_11" | "other";

export type RankTierId =
  | "newbie"
  | "bug_hunter"
  | "code_ninja"
  | "cyber_architect"
  | "grandmaster";

export type AvatarFrameId =
  | "obsidian_edge"
  | "electric_violet"
  | "cyber_cyan"
  | "hot_pink"
  | "solar_glitch";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface RankDefinition {
  id: RankTierId;
  titleAr: string;
  subtitleAr: string;
  minXp: number;
  accentHex: string;
}

export interface RankProgress {
  current: RankDefinition;
  next: RankDefinition | null;
  progressPercent: number;
  xpIntoCurrentTier: number;
  xpToNext: number;
  isMaxRank: boolean;
}

export interface AvatarFrameDefinition {
  id: AvatarFrameId;
  nameAr: string;
  ringClass: string;
  glowClass: string;
  swatchHex: string;
}

export interface StatAxis {
  key: "theory" | "problem_solving" | "code_speed" | "consistency";
  label: string;
  value: number;
  accentHex: string;
}

export interface BadgeItem {
  id: number;
  slug: string;
  titleAr: string;
  descriptionAr: string;
  iconName: "Terminal" | "Flame" | "Bug" | "Cpu" | "Shield" | "Zap";
  rarity: BadgeRarity;
  xpReward: number;
  earnedAt: string;
}

export interface HeatmapDay {
  date: string;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  xpEarned: number;
  lessonsCompleted: number;
  challengesSolved: number;
  minutesStudied: number;
  labelAr: string;
}

export interface DailyChallengePreview {
  slug: string;
  titleAr: string;
  descriptionAr: string;
  difficultyAr: string;
  language: string;
  xpReward: number;
  coinsReward: number;
  codePreview: string;
}

export interface LastLessonPreview {
  courseTitleAr: string;
  lessonTitleAr: string;
  progressPercent: number;
  durationLabelAr: string;
  href: string;
}

export interface PlayerProfileSummary {
  userId: string;
  fullName: string;
  email: string;
  grade: GradeTier;
  role: UserRole;
  xp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  avatarFrame: AvatarFrameId;
  rank: RankProgress;
}

export interface PlayerShellData {
  mode: "demo" | "supabase";
  profile: PlayerProfileSummary;
}

export interface DashboardData extends PlayerShellData {
  stats: StatAxis[];
  heatmap: HeatmapDay[];
  topBadges: BadgeItem[];
  totalEarnedBadges: number;
  dailyChallenge: DailyChallengePreview;
  playgroundPreviewCode: string;
  lastLesson: LastLessonPreview | null;
}

export interface UserSession {
  mode: "demo" | "supabase";
  userId: string;
  fullName: string;
  email: string;
  grade: GradeTier;
  role: UserRole;
  avatarFrame: AvatarFrameId;
}
