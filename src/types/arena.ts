import type { GradeTier } from "@/types/gamification";

export type QuestionType = "mcq" | "fact_or_cap" | "debug_duel" | "output_rush";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionLanguage =
  | "python"
  | "javascript"
  | "cpp"
  | "pseudocode"
  | "sql";

export type ExamCadence = "weekly" | "monthly" | "practice";

export interface BankQuestion {
  id: number;
  grade: GradeTier | "all";
  topic: string;
  questionType: QuestionType;
  promptAr: string;
  codeSnippet: string | null;
  language: QuestionLanguage;
  options: string[];
  correctAnswer: string;
  explanationAr: string;
  difficulty: QuestionDifficulty;
  sourcePdfName: string | null;
  aiGenerated: boolean;
  isApproved: boolean;
  createdAt: string;
}

export type SanitizedExamQuestion = Omit<
  BankQuestion,
  "correctAnswer" | "explanationAr"
>;

export interface ScheduledExam {
  id: number;
  titleAr: string;
  grade: GradeTier | "all";
  examCadence: ExamCadence;
  questionIds: number[];
  questionCount: number;
  durationMinutes: number;
  xpReward: number;
  coinsReward: number;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface ExamQuestionResult {
  questionId: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanationAr: string;
}

export interface ExamGradingResult {
  examId: number;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  xpAwarded: number;
  coinsAwarded: number;
  submittedAt: string;
  results: ExamQuestionResult[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  grade: GradeTier;
  rankTitleAr: string;
  weeklyXp: number;
  seasonXp: number;
  streak: number;
  solvedCount: number;
  isCurrentUser?: boolean;
}

export interface FlashBlitzOpponent {
  name: string;
  grade: GradeTier;
  rankTitleAr: string;
  accuracyRate: number;
  avgSpeedMs: number;
}

export interface FlashBlitzRoomState {
  roomCode: string;
  transport: "supabase_realtime" | "simulated_match";
  status: "idle" | "searching" | "matched" | "playing" | "finished";
  opponent: FlashBlitzOpponent | null;
}

export interface GeneratedQuestionDraft {
  draftId: string;
  grade: GradeTier | "all";
  topic: string;
  questionType: Exclude<QuestionType, "debug_duel"> | "debug_duel";
  promptAr: string;
  codeSnippet: string | null;
  language: QuestionLanguage;
  options: string[];
  correctAnswer: string;
  explanationAr: string;
  difficulty: QuestionDifficulty;
  sourcePdfName: string;
}

export interface CheatSheetSection {
  headingAr: string;
  bulletsAr: string[];
  codeExample: string | null;
}

export interface GeneratedCheatSheet {
  titleAr: string;
  summaryAr: string;
  keyTerms: Array<{ term: string; definitionAr: string }>;
  sections: CheatSheetSection[];
}

export interface AiGenerationResult {
  provider: "gemini" | "demo";
  modelUsed: string;
  sourceName: string;
  questions: GeneratedQuestionDraft[];
  cheatSheet: GeneratedCheatSheet;
}

export interface ArenaBootstrapData {
  mode: "demo" | "supabase";
  currentUser: {
    userId: string;
    fullName: string;
    grade: GradeTier;
    rankTitleAr: string;
    xp: number;
    streak: number;
  };
  factOrCapQuestions: BankQuestion[];
  outputRushQuestions: BankQuestion[];
  debugDuelQuestions: BankQuestion[];
  flashBlitzPool: BankQuestion[];
  scheduledExams: ScheduledExam[];
  leaderboardsByGrade: Record<
    "grade_10" | "grade_11",
    {
      weekly: LeaderboardEntry[];
      season: LeaderboardEntry[];
    }
  >;
  realtimeConfigured: boolean;
}
