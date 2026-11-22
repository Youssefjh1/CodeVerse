import { isValidAvatarFrame } from "@/lib/gamification/frames";
import type { AvatarFrameId, GradeTier, UserRole } from "@/types/gamification";

export const DEMO_SESSION_COOKIE_NAME = "codeverse_demo_session";

export interface DemoSessionCookie {
  userId: string;
  fullName: string;
  email: string;
  grade: GradeTier;
  role: UserRole;
  avatarFrame: AvatarFrameId;
}

export const DEFAULT_DEMO_COOKIE: DemoSessionCookie = {
  userId: "demo-student-01",
  fullName: "يوسف طارق",
  email: "youssef.demo@codeverse.eg",
  grade: "grade_11",
  role: "student",
  avatarFrame: "electric_violet",
};

const VALID_ROLES: ReadonlySet<UserRole> = new Set(["student", "admin"]);
const VALID_GRADES: ReadonlySet<GradeTier> = new Set(["grade_10", "grade_11", "other"]);

export function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.has(value as UserRole);
}

export function isValidGrade(value: unknown): value is GradeTier {
  return typeof value === "string" && VALID_GRADES.has(value as GradeTier);
}

export function parseDemoSession(rawCookieValue: string | undefined): DemoSessionCookie {
  if (!rawCookieValue || !rawCookieValue.trim()) {
    return DEFAULT_DEMO_COOKIE;
  }

  try {
    const parsed = JSON.parse(rawCookieValue) as Partial<Record<keyof DemoSessionCookie, unknown>>;
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_DEMO_COOKIE;
    }

    const userId =
      typeof parsed.userId === "string" && parsed.userId.trim().length > 0
        ? parsed.userId.trim()
        : DEFAULT_DEMO_COOKIE.userId;
    const fullName =
      typeof parsed.fullName === "string" && parsed.fullName.trim().length > 0
        ? parsed.fullName.trim()
        : DEFAULT_DEMO_COOKIE.fullName;
    const email =
      typeof parsed.email === "string" && parsed.email.trim().length > 0
        ? parsed.email.trim()
        : DEFAULT_DEMO_COOKIE.email;
    const grade = isValidGrade(parsed.grade) ? parsed.grade : DEFAULT_DEMO_COOKIE.grade;
    const role = isValidRole(parsed.role) ? parsed.role : DEFAULT_DEMO_COOKIE.role;
    const avatarFrame = isValidAvatarFrame(parsed.avatarFrame)
      ? parsed.avatarFrame
      : DEFAULT_DEMO_COOKIE.avatarFrame;

    return {
      userId,
      fullName,
      email,
      grade,
      role,
      avatarFrame,
    };
  } catch {
    return DEFAULT_DEMO_COOKIE;
  }
}
