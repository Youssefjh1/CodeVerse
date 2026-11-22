import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import type { UserSession } from "@/types/gamification";

export type AuthGuardResult =
  | { session: UserSession; response: null }
  | { session: null; response: NextResponse };

/**
 * Verifies an active authenticated session and blocks Demo Mode sessions
 * whenever Demo Mode is disabled (e.g., NODE_ENV === "production").
 */
export async function requireAuthenticatedSession(): Promise<AuthGuardResult> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      ),
    };
  }

  if (!isDemoModeEnabled() && session.mode !== "supabase") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "الجلسة التجريبية غير مصرح بها في بيئة الإنتاج." },
        { status: 401 },
      ),
    };
  }

  return { session, response: null };
}

/**
 * Enforces server-side admin authorization on privileged API endpoints.
 */
export async function requireAdminSession(): Promise<AuthGuardResult> {
  const auth = await requireAuthenticatedSession();
  if (!auth.session) {
    return auth;
  }

  if (auth.session.role !== "admin") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "صلاحية مشرف مطلوبة لهذه العملية." },
        { status: 403 },
      ),
    };
  }

  return auth;
}
