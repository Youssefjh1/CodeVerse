import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const MIGRATION_PATH = path.join(ROOT, "supabase", "migrations", "0001_initial_schema.sql");
const SEED_PATH = path.join(ROOT, "supabase", "seed.sql");

const EXPECTED_TABLES = [
  "users",
  "badges",
  "user_badges",
  "daily_activity",
  "courses",
  "lessons",
  "lesson_assets",
  "lesson_progress",
  "questions_bank",
  "exams",
  "exam_attempts",
  "challenges",
  "challenge_tests",
  "challenge_submissions",
  "products",
  "packages",
  "package_items",
  "vouchers",
  "voucher_redemptions",
  "orders",
  "order_items",
  "user_entitlements",
] as const;

describe("CodeVerse 4-phase PostgreSQL migration & seed", () => {
  it("contains 0001_initial_schema.sql and defines all 22 lowercase snake_case tables", () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true);
    const sql = readFileSync(MIGRATION_PATH, "utf8");

    expect(sql).not.toMatch(/create\s+table\s+"[A-Z]/i);

    for (const table of EXPECTED_TABLES) {
      const pattern = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\s*\\(`, "i");
      expect(sql, `Missing table public.${table}`).toMatch(pattern);
    }
  });

  it("enables and forces RLS on every single one of the 22 tables", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    for (const table of EXPECTED_TABLES) {
      const enablePattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i");
      const forcePattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+force\\s+row\\s+level\\s+security`, "i");
      expect(sql, `RLS not enabled on public.${table}`).toMatch(enablePattern);
      expect(sql, `RLS not forced on public.${table}`).toMatch(forcePattern);
    }
  });

  it("defines explicit indexes for foreign keys and key composite query paths", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");

    const requiredIndexes = [
      "users_grade_xp_idx",
      "users_role_idx",
      "user_badges_user_id_idx",
      "user_badges_badge_id_idx",
      "daily_activity_user_id_idx",
      "courses_grade_published_idx",
      "lessons_course_id_idx",
      "lesson_progress_user_id_idx",
      "lesson_progress_lesson_id_idx",
      "questions_bank_grade_topic_idx",
      "questions_bank_created_by_idx",
      "exams_grade_window_idx",
      "exams_created_by_idx",
      "exam_attempts_exam_id_idx",
      "exam_attempts_user_id_idx",
      "challenges_mode_active_idx",
      "challenge_tests_challenge_idx",
      "challenge_submissions_challenge_id_idx",
      "challenge_submissions_user_id_idx",
      "products_type_grade_idx",
      "packages_grade_active_idx",
      "package_items_package_id_idx",
      "package_items_course_id_idx",
      "package_items_product_id_idx",
      "voucher_redemptions_voucher_id_idx",
      "voucher_redemptions_user_id_idx",
      "orders_user_id_idx",
      "orders_voucher_id_idx",
      "orders_status_created_idx",
      "order_items_order_id_idx",
      "order_items_course_id_idx",
      "order_items_product_id_idx",
      "order_items_package_id_idx",
      "user_entitlements_user_id_idx",
      "user_entitlements_course_id_idx",
      "user_entitlements_product_id_idx",
      "user_entitlements_order_id_idx",
      "user_entitlements_voucher_id_idx",
    ];

    for (const indexName of requiredIndexes) {
      expect(sql, `Missing index ${indexName}`).toMatch(new RegExp(`create\\s+(?:unique\\s+)?index\\s+(?:if\\s+not\\s+exists\\s+)?${indexName}\\b`, "i"));
    }
  });

  it("hardens private.is_admin(), auth.uid() caching, privileged triggers, and sensitive tables", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+private\.is_admin\s*\(\)/i);
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toMatch(/set\s+search_path\s*=\s*''/i);
    expect(sql).toMatch(/grant\s+usage\s+on\s+schema\s+private\s+to\s+authenticated/i);
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+private\.is_admin\(\)\s+from\s+public,\s*anon/i);
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+private\.is_admin\(\)\s+to\s+authenticated/i);

    // Every SQL statement using auth.uid() must wrap it in (select auth.uid())
    const executableSql = sql.replace(/--.*$/gm, "");
    const bareAuthUidMatches = executableSql.match(/(?<!select\s+)auth\.uid\(\)/gi) ?? [];
    expect(bareAuthUidMatches).toHaveLength(0);

    expect(sql).toMatch(/prevent_student_privileged_field_edits/i);
    expect(sql).toMatch(/handle_new_auth_user/i);

    // questions_bank direct SELECT is admin-only
    expect(sql).toMatch(/create\s+policy\s+questions_bank_admin_all\s+on\s+public\.questions_bank/i);
    expect(sql).not.toMatch(/on\s+public\.questions_bank[\s\S]*for\s+select\s+to\s+(?:anon|authenticated)\s+using\s*\(\s*true/i);

    // lesson_assets checks entitlement or free preview, challenge_tests checks is_sample
    expect(sql).toMatch(/on\s+public\.lesson_assets[\s\S]*is_free_preview/i);
    expect(sql).toMatch(/on\s+public\.lesson_assets[\s\S]*user_entitlements/i);
    expect(sql).toMatch(/on\s+public\.challenge_tests[\s\S]*is_sample\s*=\s*true/i);
  });

  it("provides a portable catalog-only seed.sql without synthetic auth.users inserts", () => {
    expect(existsSync(SEED_PATH)).toBe(true);
    const seed = readFileSync(SEED_PATH, "utf8");

    expect(seed).toMatch(/on\s+conflict/i);
    expect(seed).not.toMatch(/insert\s+into\s+auth\.users/i);
    expect(seed).not.toMatch(/insert\s+into\s+auth\.identities/i);
  });
});
