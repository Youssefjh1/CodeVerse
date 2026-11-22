import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as aiGeneratePost } from "@/app/api/admin/ai-engine/generate/route";
import {
  GET as adminExamsGet,
  PATCH as adminExamsPatch,
  POST as adminExamsPost,
} from "@/app/api/admin/exams/route";
import {
  GET as adminOrdersGet,
  PATCH as adminOrdersPatch,
} from "@/app/api/admin/orders/route";
import {
  DELETE as adminQuestionsDelete,
  GET as adminQuestionsGet,
  POST as adminQuestionsPost,
} from "@/app/api/admin/questions/route";
import {
  GET as adminVouchersGet,
  PATCH as adminVouchersPatch,
  POST as adminVouchersPost,
} from "@/app/api/admin/vouchers/route";
import { POST as redeemVoucherPost } from "@/app/api/vouchers/redeem/route";
import { POST as fawryWebhookPost } from "@/app/api/webhooks/fawry/route";
import { POST as paymobWebhookPost } from "@/app/api/webhooks/paymob/route";
import { DEFAULT_DEMO_COOKIE, parseDemoSession } from "@/lib/auth/demo-cookie";
import { getCurrentSession, resolveAccessDecision } from "@/lib/auth/session";
import {
  createPrintedBookOrder,
  redeemVoucherCode,
} from "@/lib/data/phase4-store";
import { resetRateLimiterStore } from "@/lib/security/rate-limit";
import {
  areSeededTestVouchersEnabled,
  isBlockedTestVoucherCode,
  isDemoModeEnabled,
} from "@/lib/supabase/config";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentSession: vi.fn(),
  };
});

const ROOT = path.resolve(__dirname, "..");
const RLS_PATH = path.join(ROOT, "supabase", "rls-policies.sql");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const PLATFORM_LAYOUT_PATH = path.join(ROOT, "src", "app", "(platform)", "layout.tsx");

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.ALLOW_DEMO_MODE;
  delete process.env.PAYMOB_HMAC_SECRET;
  delete process.env.FAWRY_SECURITY_KEY;
  delete process.env.GEMINI_API_KEY;
  resetRateLimiterStore();
  vi.mocked(getCurrentSession).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  process.env = { ...ORIGINAL_ENV };
  resetRateLimiterStore();
});

describe("Phase 5 Production Hardening & Pre-Launch Security Audit", () => {
  it("strictly disables Demo Mode, demo cookies, and seeded test vouchers when NODE_ENV=production without ALLOW_DEMO_MODE=true", async () => {
    vi.stubEnv("NODE_ENV", "production");

    // Even when Supabase keys are missing, production fails closed by default
    expect(isDemoModeEnabled()).toBe(false);
    expect(areSeededTestVouchersEnabled()).toBe(false);
    expect(isBlockedTestVoucherCode("CODE-TERM-2026")).toBe(true);
    expect(isBlockedTestVoucherCode("CODEVERSE20")).toBe(true);
    expect(isBlockedTestVoucherCode("CODE-ALGO-1100")).toBe(true);
    expect(isBlockedTestVoucherCode("REAL-PROD-9999")).toBe(false);

    const forgedDemoAdmin = parseDemoSession(
      JSON.stringify({ ...DEFAULT_DEMO_COOKIE, role: "admin" }),
    );
    expect(
      resolveAccessDecision({
        pathname: "/dashboard",
        supabaseConfigured: false,
        demoEnabled: isDemoModeEnabled(),
        supabaseUser: null,
        demoCookie: forgedDemoAdmin,
      }),
    ).toEqual({ action: "redirect", location: "/login" });

    expect(
      resolveAccessDecision({
        pathname: "/admin",
        supabaseConfigured: false,
        demoEnabled: isDemoModeEnabled(),
        supabaseUser: null,
        demoCookie: forgedDemoAdmin,
      }),
    ).toEqual({ action: "redirect", location: "/login" });

    // Seeded test vouchers are rejected even in a live Supabase session when NODE_ENV=production
    const liveStudent = {
      mode: "supabase" as const,
      userId: "live-user-1",
      fullName: "طالب حقيقي",
      email: "student@codeverse.eg",
      phone: "01012345678",
      grade: "grade_11" as const,
      role: "student" as const,
      avatarFrame: "electric_violet" as const,
    };

    await expect(
      redeemVoucherCode(liveStudent, "CODE-TERM-2026"),
    ).rejects.toThrow(/غير صحيح/);

    await expect(
      createPrintedBookOrder(liveStudent, {
        productId: 3,
        quantity: 1,
        shippingName: "طالب حقيقي ثلاثي",
        shippingPhone: "01012345678",
        shippingGovernorate: "القاهرة",
        shippingAddress: "10 شارع التحرير، الدقي",
        paymentMethod: "cod",
        voucherCode: "CODEVERSE20",
      }),
    ).rejects.toThrow(/غير صحيح/);

    // Payment webhooks reject requests with 503 if signing secrets are missing in production
    const pmProd = await paymobWebhookPost(
      new Request("http://localhost:3000/api/webhooks/paymob", {
        method: "POST",
        body: JSON.stringify({ success: true, merchant_order_id: "ORD-1041" }),
      }),
    );
    expect(pmProd.status).toBe(503);

    const fawryProd = await fawryWebhookPost(
      new Request("http://localhost:3000/api/webhooks/fawry", {
        method: "POST",
        body: JSON.stringify({ orderStatus: "PAID", merchantRefNumber: "ORD-1041" }),
      }),
    );
    expect(fawryProd.status).toBe(503);

    // Explicit ALLOW_DEMO_MODE=true re-enables preview mode intentionally
    vi.stubEnv("ALLOW_DEMO_MODE", "true");
    expect(isDemoModeEnabled()).toBe(true);
    expect(areSeededTestVouchersEnabled()).toBe(true);
    expect(isBlockedTestVoucherCode("CODE-TERM-2026")).toBe(false);
  });

  it("enforces server-side admin authentication & authorization across all /api/admin/* handlers", async () => {
    const adminCalls: Array<{ name: string; run: () => Promise<Response> }> = [
      {
        name: "POST /api/admin/ai-engine/generate",
        run: () =>
          aiGeneratePost(
            new Request("http://localhost:3000/api/admin/ai-engine/generate", {
              method: "POST",
            }),
          ),
      },
      { name: "GET /api/admin/exams", run: () => adminExamsGet() },
      {
        name: "POST /api/admin/exams",
        run: () =>
          adminExamsPost(
            new Request("http://localhost:3000/api/admin/exams", {
              method: "POST",
            }),
          ),
      },
      {
        name: "PATCH /api/admin/exams",
        run: () =>
          adminExamsPatch(
            new Request("http://localhost:3000/api/admin/exams", {
              method: "PATCH",
            }),
          ),
      },
      { name: "GET /api/admin/orders", run: () => adminOrdersGet() },
      {
        name: "PATCH /api/admin/orders",
        run: () =>
          adminOrdersPatch(
            new Request("http://localhost:3000/api/admin/orders", {
              method: "PATCH",
            }),
          ),
      },
      { name: "GET /api/admin/questions", run: () => adminQuestionsGet() },
      {
        name: "POST /api/admin/questions",
        run: () =>
          adminQuestionsPost(
            new Request("http://localhost:3000/api/admin/questions", {
              method: "POST",
            }),
          ),
      },
      {
        name: "DELETE /api/admin/questions",
        run: () =>
          adminQuestionsDelete(
            new NextRequest("http://localhost:3000/api/admin/questions?id=1", {
              method: "DELETE",
            }),
          ),
      },
      { name: "GET /api/admin/vouchers", run: () => adminVouchersGet() },
      {
        name: "POST /api/admin/vouchers",
        run: () =>
          adminVouchersPost(
            new Request("http://localhost:3000/api/admin/vouchers", {
              method: "POST",
            }),
          ),
      },
      {
        name: "PATCH /api/admin/vouchers",
        run: () =>
          adminVouchersPatch(
            new Request("http://localhost:3000/api/admin/vouchers", {
              method: "PATCH",
            }),
          ),
      },
    ];

    for (const endpoint of adminCalls) {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
      const unauthRes = await endpoint.run();
      expect(unauthRes.status, `${endpoint.name} must return 401 when unauthenticated`).toBe(401);

      vi.mocked(getCurrentSession).mockResolvedValueOnce({
        mode: "supabase",
        userId: "student-sec-1",
        fullName: "طالب",
        email: "student@codeverse.eg",
        grade: "grade_10",
        role: "student",
        avatarFrame: "electric_violet",
      });
      const studentRes = await endpoint.run();
      expect(studentRes.status, `${endpoint.name} must return 403 for students`).toBe(403);
    }

    // Even a demo admin session is blocked with 401 in production without ALLOW_DEMO_MODE=true
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "demo-admin-forged",
      fullName: "Demo Admin",
      email: "admin@codeverse.eg",
      grade: "grade_11",
      role: "admin",
      avatarFrame: "electric_violet",
    });
    const prodDemoAdminRes = await adminVouchersGet();
    expect(prodDemoAdminRes.status).toBe(401);
  });

  it("rate limits brute-force attempts on /api/vouchers/redeem and AI generation endpoints", async () => {
    const studentSession = {
      mode: "demo" as const,
      userId: "rl-student-1",
      fullName: "طالب",
      email: "rl@codeverse.eg",
      grade: "grade_11" as const,
      role: "student" as const,
      avatarFrame: "cyber_cyan" as const,
    };

    for (let i = 0; i < 5; i++) {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(studentSession);
      const res = await redeemVoucherPost(
        new Request("http://localhost:3000/api/vouchers/redeem", {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.10" },
          body: JSON.stringify({ code: "INVALID-TEST-CODE" }),
        }),
      );
      expect(res.status).toBe(400);
      expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(4 - i));
    }

    // 6th voucher attempt hits HTTP 429
    vi.mocked(getCurrentSession).mockResolvedValueOnce(studentSession);
    const blockedVoucherRes = await redeemVoucherPost(
      new Request("http://localhost:3000/api/vouchers/redeem", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.10" },
        body: JSON.stringify({ code: "INVALID-TEST-CODE" }),
      }),
    );
    expect(blockedVoucherRes.status).toBe(429);
    expect(Number(blockedVoucherRes.headers.get("Retry-After"))).toBeGreaterThan(0);

    // Distinct student/IP has an independent bucket
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      ...studentSession,
      userId: "rl-student-2",
    });
    const secondStudentRes = await redeemVoucherPost(
      new Request("http://localhost:3000/api/vouchers/redeem", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.11" },
        body: JSON.stringify({ code: "INVALID-TEST-CODE" }),
      }),
    );
    expect(secondStudentRes.status).toBe(400);

    // AI generation rate limiting (admin user)
    const adminSession = {
      ...studentSession,
      userId: "rl-admin-1",
      role: "admin" as const,
    };

    for (let i = 0; i < 5; i++) {
      vi.mocked(getCurrentSession).mockResolvedValueOnce(adminSession);
      const form = new FormData();
      form.set("curriculumText", "خوارزمية البحث الثنائي تعمل بتعقيد O(log n).");
      form.set("grade", "grade_11");
      form.set("topic", "الخوارزميات");
      const res = await aiGeneratePost(
        new Request("http://localhost:3000/api/admin/ai-engine/generate", {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.20" },
          body: form,
        }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(4 - i));
    }

    vi.mocked(getCurrentSession).mockResolvedValueOnce(adminSession);
    const blockedForm = new FormData();
    blockedForm.set("curriculumText", "خوارزمية البحث الثنائي");
    const blockedAiRes = await aiGeneratePost(
      new Request("http://localhost:3000/api/admin/ai-engine/generate", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.20" },
        body: blockedForm,
      }),
    );
    expect(blockedAiRes.status).toBe(429);
    expect(Number(blockedAiRes.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("provides a complete hardened supabase/rls-policies.sql and production .env.example", () => {
    expect(existsSync(RLS_PATH)).toBe(true);
    const rlsSql = readFileSync(RLS_PATH, "utf8");

    const requiredTables = [
      "users",
      "vouchers",
      "orders",
      "questions_bank",
      "exams",
      "exam_attempts",
      "challenge_submissions",
      "user_entitlements",
    ];
    for (const table of requiredTables) {
      expect(rlsSql).toMatch(
        new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i"),
      );
      expect(rlsSql).toMatch(
        new RegExp(`alter\\s+table\\s+public\\.${table}\\s+force\\s+row\\s+level\\s+security`, "i"),
      );
    }

    expect(rlsSql).toMatch(/create\s+or\s+replace\s+view\s+public\.enrollments[\s\S]*security_invoker\s*=\s*true/i);
    expect(rlsSql).toMatch(/prevent_student_privileged_field_edits/i);
    expect(rlsSql).toMatch(/drop\s+policy\s+if\s+exists\s+exam_attempts_insert_own\s+on\s+public\.exam_attempts/i);
    expect(rlsSql).toMatch(/is_passed\s*=\s*false[\s\S]*xp_awarded\s*=\s*0[\s\S]*coins_awarded\s*=\s*0/i);
    expect(rlsSql).toMatch(/create\s+policy\s+vouchers_admin_all\s+on\s+public\.vouchers/i);
    expect(rlsSql).toMatch(/create\s+policy\s+questions_bank_admin_all\s+on\s+public\.questions_bank/i);

    // Every auth.uid() lookup in executable SQL must be wrapped inside (select auth.uid())
    const executableSql = rlsSql.replace(/--.*$/gm, "");
    const bareAuthUidMatches = executableSql.match(/(?<!select\s+)auth\.uid\(\)/gi) ?? [];
    expect(bareAuthUidMatches).toHaveLength(0);

    // .env.example completeness & safe defaults
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
    const envExample = readFileSync(ENV_EXAMPLE_PATH, "utf8");
    const requiredEnvKeys = [
      "NEXT_PUBLIC_SITE_URL=",
      "NEXT_PUBLIC_SUPABASE_URL=",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
      "SUPABASE_SERVICE_ROLE_KEY=",
      "ALLOW_DEMO_MODE=false",
      "GEMINI_API_KEY=",
      "GEMINI_MODEL=",
      "NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID=",
      "PAYMOB_API_KEY=",
      "PAYMOB_INTEGRATION_ID=",
      "PAYMOB_IFRAME_ID=",
      "PAYMOB_HMAC_SECRET=",
      "FAWRY_MERCHANT_CODE=",
      "FAWRY_SECURITY_KEY=",
      "RATE_LIMIT_VOUCHER_MAX=",
      "RATE_LIMIT_AI_MAX=",
    ];
    for (const key of requiredEnvKeys) {
      expect(envExample).toContain(key);
    }
    expect(envExample).not.toContain("ENABLE_DEMO_MODE=");

    // Authenticated platform layout must never statically pre-render at build time
    expect(existsSync(PLATFORM_LAYOUT_PATH)).toBe(true);
    const platformLayout = readFileSync(PLATFORM_LAYOUT_PATH, "utf8");
    expect(platformLayout).toMatch(/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/);
  });
});
