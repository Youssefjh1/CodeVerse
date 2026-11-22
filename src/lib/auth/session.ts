import { cookies } from "next/headers";
import {
  DEFAULT_DEMO_COOKIE,
  DEMO_SESSION_COOKIE_NAME,
  isValidGrade,
  isValidRole,
  parseDemoSession,
  type DemoSessionCookie,
} from "@/lib/auth/demo-cookie";
import { isValidAvatarFrame } from "@/lib/gamification/frames";
import { isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole, UserSession } from "@/types/gamification";

const PLATFORM_ROUTE_PREFIXES = [
  "/dashboard",
  "/playground",
  "/arena",
  "/courses",
  "/store",
  "/admin",
] as const;

const AUTH_ROUTES = ["/login", "/register"] as const;

export interface AccessDecisionInput {
  pathname: string;
  supabaseConfigured: boolean;
  demoEnabled: boolean;
  supabaseUser: { id: string; role: UserRole } | null;
  demoCookie: DemoSessionCookie | null;
}

export type AccessDecision =
  | { action: "allow" }
  | { action: "redirect"; location: string };

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveAccessDecision(input: AccessDecisionInput): AccessDecision {
  const isPlatformRoute = matchesPrefix(input.pathname, PLATFORM_ROUTE_PREFIXES);
  const isAdminRoute = input.pathname === "/admin" || input.pathname.startsWith("/admin/");
  const isAuthRoute = matchesPrefix(input.pathname, AUTH_ROUTES);

  // Strict production/live boundary: demo cookies are completely ignored when demoEnabled is false.
  if (input.supabaseConfigured && !input.demoEnabled) {
    if (isAuthRoute && input.supabaseUser) {
      return { action: "redirect", location: "/dashboard" };
    }
    if (isPlatformRoute && !input.supabaseUser) {
      return { action: "redirect", location: "/login" };
    }
    if (isAdminRoute && input.supabaseUser?.role !== "admin") {
      return { action: "redirect", location: "/dashboard" };
    }
    return { action: "allow" };
  }

  // Demo Mode fallback (local testing when Supabase isn't configured or explicit ENABLE_DEMO_MODE=true).
  const activeRole = input.supabaseUser?.role ?? input.demoCookie?.role ?? DEFAULT_DEMO_COOKIE.role;
  if (isAdminRoute && activeRole !== "admin") {
    return { action: "redirect", location: "/dashboard" };
  }

  return { action: "allow" };
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const supabaseConfigured = isSupabaseConfigured();
  const demoEnabled = isDemoModeEnabled();

  if (supabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, full_name, email, grade, role, avatar_frame")
        .eq("id", user.id)
        .maybeSingle();

      const metadata = user.user_metadata ?? {};
      const fullName =
        profile?.full_name ||
        (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
        user.email?.split("@")[0] ||
        "بطل CodeVerse";

      return {
        mode: "supabase",
        userId: user.id,
        fullName,
        email: profile?.email ?? user.email ?? "",
        grade: isValidGrade(profile?.grade)
          ? profile.grade
          : isValidGrade(metadata.grade)
            ? metadata.grade
            : "grade_10",
        role: isValidRole(profile?.role) ? profile.role : "student",
        avatarFrame: isValidAvatarFrame(profile?.avatar_frame)
          ? profile.avatar_frame
          : "electric_violet",
      };
    }

    if (!demoEnabled) {
      return null;
    }
  }

  if (!demoEnabled) {
    return null;
  }

  const cookieStore = await cookies();
  const demo = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value);

  return {
    mode: "demo",
    userId: demo.userId,
    fullName: demo.fullName,
    email: demo.email,
    grade: demo.grade,
    role: demo.role,
    avatarFrame: demo.avatarFrame,
  };
}
