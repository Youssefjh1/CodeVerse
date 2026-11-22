import { describe, expect, it } from "vitest";
import { DEFAULT_DEMO_COOKIE, parseDemoSession } from "@/lib/auth/demo-cookie";
import { resolveAccessDecision } from "@/lib/auth/session";

describe("Auth and Demo Mode security boundary", () => {
  it("falls back safely when codeverse_demo_session is missing, malformed, or has invalid enums", () => {
    expect(parseDemoSession(undefined)).toEqual(DEFAULT_DEMO_COOKIE);
    expect(parseDemoSession("")).toEqual(DEFAULT_DEMO_COOKIE);
    expect(parseDemoSession("{not-valid-json")).toEqual(DEFAULT_DEMO_COOKIE);

    const sanitized = parseDemoSession(
      JSON.stringify({
        userId: "u-99",
        fullName: "سارة أحمد",
        role: "super_root",
        grade: "grade_99",
        avatarFrame: "rainbow_hack",
      }),
    );

    expect(sanitized.userId).toBe("u-99");
    expect(sanitized.fullName).toBe("سارة أحمد");
    expect(sanitized.role).toBe("student");
    expect(sanitized.grade).toBe("grade_11");
    expect(sanitized.avatarFrame).toBe("electric_violet");
  });

  it("ignores forged demo admin cookies when Live Supabase Mode is active and Demo Mode is disabled", () => {
    const forgedDemoAdmin = parseDemoSession(
      JSON.stringify({ role: "admin", grade: "grade_10", avatarFrame: "cyber_cyan" }),
    );
    expect(forgedDemoAdmin.role).toBe("admin");

    const dashboardDecision = resolveAccessDecision({
      pathname: "/dashboard",
      supabaseConfigured: true,
      demoEnabled: false,
      supabaseUser: null,
      demoCookie: forgedDemoAdmin,
    });
    expect(dashboardDecision).toEqual({ action: "redirect", location: "/login" });

    const adminDecision = resolveAccessDecision({
      pathname: "/admin",
      supabaseConfigured: true,
      demoEnabled: false,
      supabaseUser: null,
      demoCookie: forgedDemoAdmin,
    });
    expect(adminDecision).toEqual({ action: "redirect", location: "/login" });
  });

  it("blocks authenticated students from /admin and allows verified admins", () => {
    const studentOnAdmin = resolveAccessDecision({
      pathname: "/admin",
      supabaseConfigured: true,
      demoEnabled: false,
      supabaseUser: { id: "stu-1", role: "student" },
      demoCookie: null,
    });
    expect(studentOnAdmin).toEqual({ action: "redirect", location: "/dashboard" });

    const adminOnAdmin = resolveAccessDecision({
      pathname: "/admin",
      supabaseConfigured: true,
      demoEnabled: false,
      supabaseUser: { id: "adm-1", role: "admin" },
      demoCookie: null,
    });
    expect(adminOnAdmin).toEqual({ action: "allow" });

    const authedOnLogin = resolveAccessDecision({
      pathname: "/login",
      supabaseConfigured: true,
      demoEnabled: false,
      supabaseUser: { id: "stu-1", role: "student" },
      demoCookie: null,
    });
    expect(authedOnLogin).toEqual({ action: "redirect", location: "/dashboard" });
  });

  it("allows instant /dashboard access in Demo Mode and enforces role on /admin", () => {
    expect(
      resolveAccessDecision({
        pathname: "/dashboard",
        supabaseConfigured: false,
        demoEnabled: true,
        supabaseUser: null,
        demoCookie: DEFAULT_DEMO_COOKIE,
      }),
    ).toEqual({ action: "allow" });

    expect(
      resolveAccessDecision({
        pathname: "/admin",
        supabaseConfigured: false,
        demoEnabled: true,
        supabaseUser: null,
        demoCookie: DEFAULT_DEMO_COOKIE,
      }),
    ).toEqual({ action: "redirect", location: "/dashboard" });

    expect(
      resolveAccessDecision({
        pathname: "/admin",
        supabaseConfigured: false,
        demoEnabled: true,
        supabaseUser: null,
        demoCookie: { ...DEFAULT_DEMO_COOKIE, role: "admin" },
      }),
    ).toEqual({ action: "allow" });
  });
});
