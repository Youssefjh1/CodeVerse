import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_SESSION_COOKIE_NAME,
  isValidRole,
  parseDemoSession,
} from "@/lib/auth/demo-cookie";
import { resolveAccessDecision } from "@/lib/auth/session";
import { getSupabaseEnv, isDemoModeEnabled } from "@/lib/supabase/config";
import type { UserRole } from "@/types/gamification";

export async function middleware(request: NextRequest) {
  const env = getSupabaseEnv();
  const supabaseConfigured = env !== null;
  const demoEnabled = isDemoModeEnabled();

  let response = NextResponse.next({ request });
  let supabaseUser: { id: string; role: UserRole } | null = null;

  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      let role: UserRole = "student";
      if (request.nextUrl.pathname.startsWith("/admin")) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (isValidRole(profile?.role)) {
          role = profile.role;
        }
      }
      supabaseUser = { id: user.id, role };
    }
  }

  const demoCookie = demoEnabled
    ? parseDemoSession(request.cookies.get(DEMO_SESSION_COOKIE_NAME)?.value)
    : null;

  const decision = resolveAccessDecision({
    pathname: request.nextUrl.pathname,
    supabaseConfigured,
    demoEnabled,
    supabaseUser,
    demoCookie,
  });

  if (decision.action === "redirect") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = decision.location;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
