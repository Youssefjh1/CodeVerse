# CodeVerse — Phase 1 Design Specification

- **Date:** 2026-11-22
- **Target Workspace:** `d:\Manasaty` (standalone Next.js repository, completely isolated from `d:\Centerverse`)
- **Target Audience:** Egyptian High School Gen Z Students (`أولى ثانوي` / `grade_10`, `تانية ثانوي` / `grade_11`, `صفوف أخرى` / `other`) + Platform Administrators (`admin`)
- **Primary Language & Theme:** Arabic (`dir="rtl"`), Dark Mode Only (`#09090B` / `#0D0F1A`) with `dir="ltr"` forced for code blocks, Monaco previews, and terminal outputs

---

## 1. Intent & Why

High school computer science and programming education in Egypt often suffers from dry PDFs, static slide decks, and dull LMS portals that feel disconnected from how Gen Z students spend their screen time. **CodeVerse** reframes learning programming and computer science theory into a high-energy, dark-obsidian cyber/gaming progression system: every lesson watched, bug fixed, and theory challenge solved translates into XP, Coins, daily study Streaks, Rank Tier promotions, and collectible Badges.

Phase 1 lays the foundation so Phases 2–4 plug in cleanly without database rewrites, auth refactoring, or layout hacks:
1. A complete, multi-phase PostgreSQL/Supabase schema with strict Row-Level Security (RLS) and performance indexing from day one.
2. Authentication and role/grade routing (`student` / `admin` and grade tiers) with a seamless cookie-backed Demo Mode fallback when Supabase credentials are not yet configured.
3. The Arabic RTL Cyber/Gaming Design System, responsive navigation shell (Desktop Sidebar + Mobile HUD & Bottom Nav), and the full **Student Gamer Dashboard (`/dashboard`)** seeded with realistic, deterministic Egyptian Gen Z mock data.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals (Phase 1 Deliverables)
- Initialize a clean Next.js 15 (App Router) + TypeScript + Tailwind CSS v3.4 + Framer Motion + Lucide React project inside `d:\Manasaty`.
- Author the complete 4-phase PostgreSQL schema (`supabase/migrations/0001_initial_schema.sql`) covering all 22 domain tables, constraints, indexes, security triggers, and RLS policies, plus a portable catalog-only `supabase/seed.sql`.
- Implement real Supabase Auth (`/login`, `/register`, `/auth/callback`, `middleware.ts`) using `@supabase/ssr`, plus an automatic cookie-backed Demo Mode (`codeverse_demo_session`) active **only** when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent (or when explicit non-production `ENABLE_DEMO_MODE=true` is enabled), allowing instant testing of `student` vs `admin` roles, Grade selection (`أولى ثانوي` / `تانية ثانوي` / `صفوف أخرى`), and Avatar Frame persistence across reloads.
- Build the dark-only Cyber/Gaming UI shell (`dir="rtl"` with `Cairo` + `JetBrains Mono` in `dir="ltr"` for code) featuring a responsive Desktop Cyber Sidebar and Mobile Top HUD + Bottom Nav showing live XP bar, Coins counter, Streak flame, and Grade badge.
- Deliver the complete Student Gamer Dashboard (`/dashboard`):
  - **Player Stats Hero Card:** Chamfered neon-bordered hero card with live customizable Neon Avatar Frame switcher (`5` selectable frames), Rank Tier badge (`newbie` -> `bug_hunter` -> `code_ninja` -> `cyber_architect` -> `grandmaster`), and a 4-axis SVG Radar + breakdown bars (`النظري`, `حل المشكلات`, `سرعة الكود`, `الالتزام`).
  - **Activity Heatmap:** GitHub-style 16-week (`112`-day) deterministic study heatmap in neon purple/cyan (`5` intensity levels `0..4`) with interactive Arabic hover/focus tooltips.
  - **Trophy Showcase:** Top `3` earned badges with rarity glow + exact XP progress bar toward the next Rank Tier.
  - **Quick Launch Cards:** Visually distinct mission cards for **تحدي اليوم (Daily Challenge)**, **محرر الكود التفاعلي (Interactive Code Playground preview with `dir="ltr"` `JetBrains Mono` snippet)**, and **آخر درس (Last Lesson resume card with progress bar)**.
- Prepare clean, branded placeholder shell routes for Phases 2–4 (`/playground`, `/arena`, `/courses`, `/store`, `/admin`) wired into navigation so every sidebar/bottom-nav link resolves cleanly with zero 404s.

### Non-Goals (Explicitly Deferred to Phases 2–4)
- **Phase 2:** Live `@monaco-editor/react` execution sandbox, line-by-line visualizer, memory/variables inspector, or animated console runtime (only clean `/playground` placeholder route + static syntax-styled preview on `/dashboard` in Phase 1).
- **Phase 3:** Interactive Arena mini-games (Fact or Cap, Debug Duel, Output Rush, 1v1 Flash Blitz), Supabase Realtime multiplayer sockets, Grade/Weekly live leaderboards, or `@google/genai` PDF-grounded Exam Engine.
- **Phase 4:** Dynamic watermarking video player (`Student Name + Phone`), protected PDF viewer, printed book shipping checkout, bundle pricing engine, voucher redemption endpoints, or Paymob/Fawry payment gateway integration.
- **Out of Scope:** Light Mode toggle, multi-language English UI toggle, or any modification to `d:\Centerverse`.

### Anti-Goals (Failure Modes to Avoid)
- Do **not** build a generic SaaS dashboard with identical rounded cards, identical shadows, and rainbow neon borders on every card.
- Do **not** emit ALL-CAPS English eyebrow labels (`PLAYER STATS`, `DAILY QUEST`) above Arabic headings or append `→` arrows to buttons.
- Do **not** mix RTL and LTR inside code blocks, numeric counters (`tabular-nums`), or terminal badges.
- Do **not** trigger React hydration mismatches from `new Date()` or `Math.random()` inside Client Components — anchor heatmap/date seeds deterministically.
- Do **not** allow student clients to mutate `role`, `xp`, `coins`, `streak`, or `rank_tier` via Supabase REST updates, and do **not** expose `questions_bank.correct_answer` via student-readable RLS.
- Do **not** crash when `.env.local` has no Supabase keys.

---

## 3. Environment & Technical Constraints

- **Workspace Isolation:** All files live in `d:\Manasaty` (separate Git repository). Never create or modify files in `d:\Centerverse`.
- **Node.js Runtime Compatibility (Architectural Call):** The machine runs Node.js `v18.19.0`. Next.js 16 requires Node `>=20.9.0`, whereas **Next.js 15 (`^15.5.0`) + React 19 (`^19.0.0`)** and **Tailwind CSS `^3.4.17`** (with classic `tailwind.config.ts`) run reliably on Node `v18.19.0`.
- **Core Packages:**
  - `next` (`^15.5.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`), `typescript` (`^5.7.0`)
  - `tailwindcss` (`^3.4.17`), `postcss`, `autoprefixer`
  - `framer-motion` (`^12.x`), `lucide-react` (`^0.475.0`+)
  - `@supabase/supabase-js` (`^2.x`), `@supabase/ssr` (`^0.5.x`)
  - **Testing:** `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- **Performance & Accessibility Floor (`vercel-react-best-practices`):**
  - Default to React Server Components (`page.tsx`, `layout.tsx`) and isolate Framer Motion / interactive widgets into focused `"use client"` islands.
  - Import icons and utilities directly (`import { Flame } from "lucide-react"` — no custom barrel re-export files).
  - Load `Cairo` and `JetBrains_Mono` once via `next/font/google` in `src/app/layout.tsx` exposing CSS variables `--font-cairo` and `--font-mono`.
  - Animate `div` wrappers rather than raw `<svg>` elements; keep SVG coordinates concise; respect `prefers-reduced-motion` via Framer Motion `<MotionConfig reducedMotion="user">` and CSS `@media (prefers-reduced-motion: reduce)`.
  - Ensure WCAG AA contrast (`#F4F4F8` primary text and `#A3ABC8` secondary slate on `#09090B` / `#141828`) and visible `focus-visible` cyber-cyan rings for keyboard navigation.

---

## 4. Approaches Considered & Selected

| Approach | Summary | Trade-offs | Decision |
| :--- | :--- | :--- | :--- |
| **1. Supabase-First (SQL Migrations + RLS + `@supabase/ssr` + Demo Mode)** | Native PostgreSQL schema in `supabase/migrations/`, database-enforced RLS & triggers, `@supabase/ssr` session cookies, automatic Demo Mode fallback when env vars are absent. | Tighter coupling to Supabase Auth/RLS idioms (`auth.uid()`), though SQL itself remains standard PostgreSQL. | **Selected by User** — natively unlocks Phase 3 Realtime (1v1 Flash Blitz) & Phase 4 Storage (protected PDFs/videos) with zero backend rewrite. |
| **2. Prisma + Standalone PostgreSQL + Custom Auth** | `schema.prisma`, custom JWT/session cookies, standalone Postgres database. | Flexible hosting & strong Prisma types, but requires building a separate WebSocket/Realtime service for Phase 3 and separate file storage/auth layer for Phase 4. | Rejected |
| **3. Hybrid Supabase Auth + Prisma ORM** | Supabase for Auth/Realtime paired with Prisma for queries. | Introduces constant friction keeping `prisma migrate` synchronized with Supabase `auth.users` triggers and RLS policies. | Rejected |

---

## 5. Complete 4-Phase Database Schema Specification

All SQL lives in `d:\Manasaty\supabase\migrations\0001_initial_schema.sql` and companion seed data in `d:\Manasaty\supabase\seed.sql`.

### PostgreSQL Best Practices Enforced (`supabase-postgres-best-practices`)
1. **Lowercase `snake_case` Identifiers:** Zero quoted mixed-case table or column names.
2. **Primary Keys:** `bigint generated always as identity primary key` on all domain tables; `uuid primary key references auth.users(id) on delete cascade` on `public.users`.
3. **Appropriate Data Types:** `text` with explicit `check` constraints for enums/statuses, `timestamptz` for all timestamps, `numeric(10,2)` for EGP monetary amounts, `integer` / `bigint` for numeric counters, `jsonb` for structured options/test-cases/metadata.
4. **Foreign Key Indexing:** Every foreign key column has an explicit B-tree index (`CREATE INDEX ...`) to accelerate joins, RLS checks, and `ON DELETE CASCADE`.
5. **Composite & Query-Driven Indexes:**
   - `users (grade, xp desc)` for grade-filtered Phase 3 leaderboards.
   - `orders (status, created_at desc)` for Phase 4 admin order fulfillment queues.
   - `daily_activity (user_id, activity_date desc)` via unique constraint `(user_id, activity_date)` for fast heatmap scans.
   - `questions_bank (grade, topic, difficulty)` for Phase 3 exam/arena filtering.
6. **Row-Level Security (RLS) & Privilege Hardening:**
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all 22 tables in `public`.
   - Wrap `auth.uid()` inside `(select auth.uid())` in every policy so Postgres caches the UID once per statement rather than evaluating per row.
   - Define `private` schema helper `private.is_admin()` (`SECURITY DEFINER`, `SET search_path = ''`, reading `(select auth.uid()) IS NOT NULL AND EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')`). Keep `private` outside PostgREST's exposed schemas (`public`, `graphql_public`), revoke `ALL` on `private` and `private.is_admin()` from `PUBLIC` and `anon`, and grant `USAGE` on schema `private` + `EXECUTE` on `private.is_admin()` to `authenticated` and `service_role` so RLS expressions evaluated as `authenticated` execute without `42501` permission errors. Split public catalog read policies (`TO anon, authenticated` without calling `private.is_admin()`) from admin management policies (`TO authenticated USING ((select private.is_admin()))`) so `anon` never invokes `private.is_admin()`.
   - **Privileged Field Guard Trigger:** `public.prevent_student_privileged_field_edits()` (`BEFORE UPDATE` on `public.users`) raises an exception if a non-admin authenticated user attempts to modify `role`, `xp`, `coins`, `streak`, `longest_streak`, `rank_tier`, or `stat_*`. Students can safely update `full_name`, `phone`, `grade`, `avatar_url`, and `avatar_frame`.
   - **Signup Trigger:** `public.handle_new_auth_user()` (`AFTER INSERT ON auth.users`) creates the matching `public.users` row, always forcing `role = 'student'` regardless of client-supplied metadata (admin accounts are promoted via SQL/service role only).
   - **Exam, Video & Challenge Integrity:**
     - Direct `SELECT` on `questions_bank` is restricted to `admin` only (`(select private.is_admin())`). Students in Phase 3 receive sanitized question payloads via a server route or `SECURITY DEFINER` RPC that strips `correct_answer` and `explanation_ar`.
     - Paid lesson media/solutions live in `public.lesson_assets` (separated from public syllabus `public.lessons`) with RLS allowing `SELECT` only when `lesson.is_free_preview = true`, an active `public.user_entitlements` row grants the parent course, or `(select private.is_admin())`.
     - Challenge test cases live in `public.challenge_tests` (separated from public `public.challenges`) with RLS allowing students to read only `is_sample = true` rows while hidden grading cases stay admin/server-only.
     - Paid unlocks from orders, `full_unlock` vouchers, package expansions, and manual admin grants materialize into `public.user_entitlements` as the single O(1)-indexed entitlement ledger for Phase 4 video/PDF RLS and Supabase Storage rules.

### Complete Table Inventory (22 Tables)

| # | Table | Key Columns & Types | Purpose & Phase | Key Constraints & Indexes |
| :- | :--- | :--- | :--- | :--- |
| 1 | `public.users` | `id` (uuid PK -> `auth.users`), `full_name` (text), `email` (text unique), `phone` (text), `role` (`student` \| `admin`), `grade` (`grade_10` \| `grade_11` \| `other`), `xp` (bigint >= 0), `coins` (integer >= 0), `streak` (integer >= 0), `longest_streak` (integer >= 0), `rank_tier` (`newbie` \| `bug_hunter` \| `code_ninja` \| `cyber_architect` \| `grandmaster`), `avatar_frame` (`obsidian_edge` \| `electric_violet` \| `cyber_cyan` \| `hot_pink` \| `solar_glitch`), `avatar_url` (text), `stat_theory` (0..100), `stat_problem_solving` (0..100), `stat_code_speed` (0..100), `stat_consistency` (0..100), `created_at`, `updated_at` | Core profile & gamification state (Phase 1) | `users_grade_xp_idx (grade, xp desc)`, `users_role_idx (role)` |
| 2 | `public.badges` | `id` (identity PK), `slug` (text unique), `title_ar` (text), `description_ar` (text), `icon_name` (text), `rarity` (`common` \| `rare` \| `epic` \| `legendary`), `xp_reward` (int), `criteria_type` (text), `criteria_value` (int), `created_at` | Collectible achievements catalog (Phase 1) | Unique `slug` |
| 3 | `public.user_badges` | `id` (identity PK), `user_id` (uuid FK -> `users`), `badge_id` (bigint FK -> `badges`), `earned_at` (timestamptz) | Student earned badges (Phase 1) | Unique `(user_id, badge_id)`, indexes on `user_id`, `badge_id` |
| 4 | `public.daily_activity` | `id` (identity PK), `user_id` (uuid FK -> `users`), `activity_date` (date), `xp_earned` (int >= 0), `lessons_completed` (int >= 0), `challenges_solved` (int >= 0), `minutes_studied` (int >= 0), `intensity_level` (smallint 0..4) | 16-week contribution heatmap log (Phase 1+) | Unique `(user_id, activity_date)`, index on `user_id` |
| 5 | `public.courses` | `id` (identity PK), `slug` (text unique), `title_ar` (text), `description_ar` (text), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `track` (text), `thumbnail_url` (text), `price_egp` (numeric(10,2)), `is_free` (boolean), `is_published` (boolean), `sort_order` (int), `created_at`, `updated_at` | Curriculum courses (Phase 1/4) | `courses_grade_published_idx (grade, is_published)` |
| 6 | `public.lessons` | `id` (identity PK), `course_id` (bigint FK -> `courses` cascade), `slug` (text), `title_ar` (text), `lesson_type` (`video` \| `interactive_code` \| `article` \| `quiz`), `duration_seconds` (int), `xp_reward` (int), `sort_order` (int), `is_free_preview` (boolean), `is_published` (boolean), `created_at` | Public syllabus metadata (Phase 1/2/4) | Unique `(course_id, slug)`, `lessons_course_id_idx (course_id)` |
| 7 | `public.lesson_assets` | `lesson_id` (bigint PK FK -> `lessons` cascade), `video_storage_path` (text), `starter_code` (text), `solution_notes` (text), `updated_at` (timestamptz) | Entitlement-gated video paths & lesson code assets (Phase 2/4) | PK/FK `lesson_id`; RLS gated by `is_free_preview`, `user_entitlements`, or admin |
| 8 | `public.lesson_progress` | `id` (identity PK), `user_id` (uuid FK -> `users`), `lesson_id` (bigint FK -> `lessons`), `progress_percent` (smallint 0..100), `last_position_seconds` (int), `is_completed` (boolean), `last_accessed_at` (timestamptz) | "Last Lesson" resume & completion state (Phase 1/4) | Unique `(user_id, lesson_id)`, indexes on `user_id`, `lesson_id` |
| 9 | `public.questions_bank` | `id` (identity PK), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `topic` (text), `question_type` (`mcq` \| `fact_or_cap` \| `debug_duel` \| `output_rush`), `prompt_ar` (text), `code_snippet` (text), `language` (`python` \| `javascript` \| `cpp` \| `pseudocode` \| `sql`), `options_json` (jsonb), `correct_answer` (text), `explanation_ar` (text), `difficulty` (`easy` \| `medium` \| `hard`), `source_pdf_name` (text), `ai_generated` (boolean), `is_approved` (boolean), `created_by` (uuid FK -> `users` set null), `created_at` | Theory & code question pool + AI-approved bank (Phase 3) | `questions_bank_grade_topic_idx (grade, topic, difficulty)`, `questions_bank_created_by_idx (created_by)` |
| 10 | `public.exams` | `id` (identity PK), `title_ar` (text), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `exam_cadence` (`weekly` \| `monthly` \| `practice`), `question_ids` (bigint[]), `duration_minutes` (int), `xp_reward` (int), `coins_reward` (int), `starts_at` (timestamptz), `ends_at` (timestamptz), `is_published` (boolean), `created_by` (uuid FK -> `users` set null), `created_at` | Auto-scheduled weekly/monthly exams (Phase 3) | `exams_grade_window_idx (grade, is_published, starts_at)`, `exams_created_by_idx (created_by)` |
| 11 | `public.exam_attempts` | `id` (identity PK), `exam_id` (bigint FK -> `exams` cascade), `user_id` (uuid FK -> `users` cascade), `answers_json` (jsonb), `score_percent` (numeric(5,2)), `xp_awarded` (int), `started_at` (timestamptz), `submitted_at` (timestamptz) | Student exam results (Phase 3) | Indexes on `exam_id`, `user_id` |
| 12 | `public.challenges` | `id` (identity PK), `slug` (text unique), `title_ar` (text), `description_ar` (text), `mode` (`daily` \| `fact_or_cap` \| `debug_duel` \| `output_rush` \| `flash_blitz_1v1`), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `difficulty` (`easy` \| `medium` \| `hard`), `language` (`python` \| `javascript` \| `cpp` \| `pseudocode`), `starter_code` (text), `xp_reward` (int), `coins_reward` (int), `time_limit_seconds` (int), `active_date` (date), `is_active` (boolean), `created_at` | Public challenge definitions & Arena modes (Phase 1/2/3) | `challenges_mode_active_idx (mode, is_active, active_date)` |
| 13 | `public.challenge_tests` | `id` (identity PK), `challenge_id` (bigint FK -> `challenges` cascade), `is_sample` (boolean default false), `input_data` (text), `expected_output` (text), `sort_order` (int) | Sample vs hidden grading test cases (Phase 2/3) | `challenge_tests_challenge_idx (challenge_id, is_sample)`; RLS hides `is_sample = false` from students |
| 14 | `public.challenge_submissions` | `id` (identity PK), `challenge_id` (bigint FK -> `challenges` cascade), `user_id` (uuid FK -> `users` cascade), `submitted_code` (text), `is_passed` (boolean), `execution_ms` (int), `xp_awarded` (int), `coins_awarded` (int), `created_at` | Challenge attempts & speed tracking (Phase 2/3) | Indexes on `challenge_id`, `user_id` |
| 15 | `public.products` | `id` (identity PK), `slug` (text unique), `title_ar` (text), `description_ar` (text), `product_type` (`pdf_note` \| `printed_book`), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `price_egp` (numeric(10,2)), `storage_path` (text), `stock_count` (int nullable), `cover_url` (text), `is_active` (boolean), `created_at` | Protected PDFs & printed study books (Phase 4) | `products_type_grade_idx (product_type, grade, is_active)` |
| 16 | `public.packages` | `id` (identity PK), `slug` (text unique), `title_ar` (text), `description_ar` (text), `grade` (`grade_10` \| `grade_11` \| `other` \| `all`), `price_egp` (numeric(10,2)), `discount_percent` (smallint 0..100), `is_active` (boolean), `created_at` | Course + Notes bundles (Phase 4) | `packages_grade_active_idx (grade, is_active)` |
| 17 | `public.package_items` | `id` (identity PK), `package_id` (bigint FK -> `packages` cascade), `item_type` (`course` \| `product`), `course_id` (bigint FK -> `courses` cascade nullable), `product_id` (bigint FK -> `products` cascade nullable) | Bundle item mapping (Phase 4) | CHECK ensuring exclusive target (`(item_type='course' AND course_id IS NOT NULL AND product_id IS NULL) OR (item_type='product' AND product_id IS NOT NULL AND course_id IS NULL)`), indexes on `package_id`, `course_id`, `product_id` |
| 18 | `public.vouchers` | `id` (identity PK), `code` (text unique), `discount_type` (`percent` \| `fixed_egp` \| `full_unlock`), `discount_value` (numeric(10,2)), `applies_to` (`all` \| `course` \| `product` \| `package`), `target_id` (bigint nullable), `max_uses` (int >= 1), `current_uses` (int >= 0), `expires_at` (timestamptz), `is_active` (boolean), `created_at` | Center/promo voucher codes (Phase 4) | Unique `code`, CHECK `current_uses <= max_uses` |
| 19 | `public.voucher_redemptions` | `id` (identity PK), `voucher_id` (bigint FK -> `vouchers` cascade), `user_id` (uuid FK -> `users` cascade), `order_id` (bigint nullable), `redeemed_at` (timestamptz) | One redemption per user per voucher (Phase 4) | Unique `(voucher_id, user_id)`, indexes on `voucher_id`, `user_id` |
| 20 | `public.orders` | `id` (identity PK), `user_id` (uuid FK -> `users` restrict), `status` (`pending` \| `paid` \| `shipped` \| `delivered` \| `cancelled` \| `refunded`), `payment_method` (`paymob` \| `fawry` \| `voucher` \| `cod`), `payment_reference` (text), `subtotal_egp` (numeric(10,2)), `discount_egp` (numeric(10,2)), `total_egp` (numeric(10,2)), `voucher_id` (bigint FK -> `vouchers` set null), `shipping_name` (text), `shipping_phone` (text), `shipping_governorate` (text), `shipping_address` (text), `created_at`, `updated_at` | Store orders & shipping data (Phase 4) | `orders_user_id_idx (user_id)`, `orders_voucher_id_idx (voucher_id)`, `orders_status_created_idx (status, created_at desc)` |
| 21 | `public.order_items` | `id` (identity PK), `order_id` (bigint FK -> `orders` cascade), `item_type` (`course` \| `product` \| `package`), `course_id` (bigint FK -> `courses` set null), `product_id` (bigint FK -> `products` set null), `package_id` (bigint FK -> `packages` set null), `unit_price_egp` (numeric(10,2)), `quantity` (int >= 1) | Order line items (Phase 4) | CHECK ensuring single non-null FK matching `item_type`, indexes on `order_id`, `course_id`, `product_id`, `package_id` |
| 22 | `public.user_entitlements` | `id` (identity PK), `user_id` (uuid FK -> `users` cascade), `item_type` (`course` \| `product`), `course_id` (bigint FK -> `courses` cascade nullable), `product_id` (bigint FK -> `products` cascade nullable), `source` (`order` \| `voucher` \| `package` \| `admin_grant`), `order_id` (bigint FK -> `orders` set null), `voucher_id` (bigint FK -> `vouchers` set null), `granted_at` (timestamptz), `expires_at` (timestamptz nullable) | Single O(1) entitlement ledger for paid videos/PDFs (Phase 4) | CHECK matching `item_type`, partial unique indexes `(user_id, course_id)` & `(user_id, product_id)`, indexes on `user_id`, `course_id`, `product_id`, `order_id`, `voucher_id` |

### Portable Seed Strategy (`supabase/seed.sql`)
- `supabase/seed.sql` seeds **only** public catalog and content tables (`badges`, `courses`, `lessons`, `lesson_assets`, `challenges`, `challenge_tests`, `questions_bank`, `exams`, `products`, `packages`, `package_items`, `vouchers`) idempotently (`ON CONFLICT DO NOTHING`).
- It does **not** insert synthetic rows into `auth.users` or `auth.identities`, ensuring 100% portability across both local `supabase db reset` and hosted Supabase SQL Editor. A short commented SQL snippet in `seed.sql` shows how to promote any registered email to `admin` via `UPDATE public.users SET role = 'admin' WHERE email = '...';`.

---

## 6. Authentication, Demo Mode Boundary & Dashboard Data Source

### Modes of Operation
`src/lib/supabase/config.ts` exports `isSupabaseConfigured()` checking `Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)` and `isDemoModeEnabled()` returning `!isSupabaseConfigured() || process.env.ENABLE_DEMO_MODE === "true"` (never active in live production unless explicitly enabled).

1. **Live Supabase Mode** (`isSupabaseConfigured() === true`):
   - Uses `@supabase/ssr` (`createServerClient` in Server Components/Actions, `createBrowserClient` in Client Components) with cookie management in `src/middleware.ts`.
   - **Strict Security Boundary:** `codeverse_demo_session` is completely **ignored** by `middleware.ts` and `getCurrentSession()`, and `switchDemoRoleAction` rejects requests when `!isDemoModeEnabled()`, preventing any client-side cookie or role-toggle bypass into `/admin`. `/login` shows real Supabase authentication only (no instant admin demo bypass).
   - **Protected Route Policy:** All `(platform)` routes (`/dashboard`, `/playground`, `/arena`, `/courses`, `/store`, `/admin`) require an authenticated Supabase session; unauthenticated requests redirect to `/login`. Requests to `/admin` also verify `public.users.role === 'admin'` (non-admins redirect to `/dashboard`).
   - `/register`: collects `fullName`, `email`, `password`, `phone` (Egyptian mobile format), and `grade` (`أولى ثانوي` / `تانية ثانوي` / `صفوف أخرى`), passing `grade`, `full_name`, and `phone` in `options.data` so `public.handle_new_auth_user()` populates `public.users` with `role = 'student'`.
   - `/login`: email/password sign-in via Supabase Auth, plus `/auth/callback` route handler for verification/OAuth code exchange.
   - **Live Dashboard Data (`src/lib/data/dashboard.ts`):** Queries real rows for the signed-in user (`public.users`, `user_badges` joined with `badges`, `daily_activity` over the last 112 days, `lesson_progress` joined with `lessons`/`courses`, and active `challenges` for `mode = 'daily'`). Brand-new accounts with `0` XP/badges/activity render tailored, encouraging Arabic empty/zero states across Trophy Showcase, Heatmap, Radar, and Last Lesson (recommending the first free-preview lesson) instead of fake mock stats.

2. **Automatic Cookie-Backed Demo Mode** (`!isSupabaseConfigured()`):
   - Visiting `/` or `/dashboard` immediately works out-of-the-box with zero `.env.local` setup.
   - Reads/writes a lightweight HTTP cookie `codeverse_demo_session` storing JSON `{ "userId": string, "fullName": string, "grade": GradeTier, "role": UserRole, "avatarFrame": AvatarFrameId }`.
   - `src/lib/data/dashboard.ts` hydrates from `src/lib/data/mock-dashboard.ts` overlaid with cookie selections so the dashboard immediately demonstrates a realistic Egyptian Gen Z student profile (`3,450 XP`, earned badges, 16-week heatmap, active streak).
   - Server Actions (`switchDemoRoleAction`, `updateDemoGradeAction`, `updateAvatarFrameAction`) persist changes across page reloads via `revalidatePath("/", "layout")`, and a subtle sidebar status pill (`وضع تجريبي محلي`) exposes quick Grade & Student/Admin preview toggles.

---

## 7. Design System & Visual Architecture (`frontend-design` Two-Pass Plan)

### Pass 1: Design Token & Layout Blueprint
- **Color Palette (Dark-Mode Only):**
  - `--bg-obsidian: #09090B` (root page canvas)
  - `--bg-elevated: #0D0F1A` (sidebar, secondary panel canvas, subtle top cyber grid fade)
  - `--surface-glass: rgba(20, 24, 40, 0.72)` (card fills with `backdrop-filter: blur(16px)` and `1px solid rgba(139, 92, 246, 0.18)`)
  - `--accent-purple: #8B5CF6` (Electric Purple — primary rank/XP & interactive focus)
  - `--accent-cyan: #06B6D4` (Cyber Cyan — code speed, heatmap peak, primary action border)
  - `--accent-pink: #EC4899` (Hot Pink — daily streak flame, epic badges, Glitch hover edge)
  - `--text-primary: #F4F4F8` (crisp readable off-white)
  - `--text-muted: #9CA3C4` (legible slate secondary copy)
- **Typography:**
  - Arabic UI & Headings: `Cairo` (`400`, `600`, `700`, `800`) applied globally on `html[lang="ar"][dir="rtl"]`.
  - Code, Terminal & Numerical Telemetry: `JetBrains Mono` (`400`, `500`, `700`) forced `dir="ltr"` via utility `.code-ltr` (`direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums;`).
- **Layout Concept & Wireframe (Desktop `dir="rtl"`):**
  - Fixed `260px` right-hand **Cyber Sidebar** (`border-l border-purple-500/20`) containing: Brand emblem (`CodeVerse`), Student mini-card (Grade badge + live XP bar to next rank + Coins + Streak flame), and 6 navigation routes (`لوحة اللاعب` `/dashboard`, `ملعب الكود` `/playground`, `ساحة التحديات` `/arena`, `الكورسات` `/courses`, `المتجر والمذكرات` `/store`, plus conditional `لوحة الإدارة` `/admin` visible when `role === 'admin'`).
  - Main scrollable stage (`max-w-[1360px] mx-auto`): Asymmetric 12-column grid instead of uniform cards:
    ```text
    [ Mobile Top HUD (Grade + XP + Coins + Streak) ]
    +--------------------------+----------------------------------------+
    |  Sidebar (RTL Right)     |  Greeting + Quick Grade/Role Switcher  |
    |  - CodeVerse Logo            +----------------------------------------+
    |  - XP / Coins / Streak   |  HERO (12 cols): Player Stats Card     |
    |  - Nav Links (6 routes)  |  [Avatar+Frame Switcher | Rank | Radar] |
    |  - Demo Mode Switcher    +---------------------+------------------+
    |                          |  Heatmap (7 cols)   | Trophy Case (5)  |
    |                          |  16-wk Study Grid   | Top 3 + NextRank |
    |                          +---------------------+------------------+
    |                          |  Quick Launch Missions (3 asymmetric)  |
    |                          |  [Daily Challenge | Code Preview | Lesson]|
    +--------------------------+----------------------------------------+
    [ Mobile Bottom Nav (5 core tabs) ]
    ```

### Pass 2: Review Against Restraint & Anti-Slop Rules
- **Boldness Concentration:** Only the **Player Stats Hero Card** carries chamfered corner clips, animated neon avatar frame aura, and the glowing 4-axis SVG radar. Supporting cards (Heatmap, Trophy Showcase, Quick Launch) use disciplined obsidian glass with thin hairline borders and targeted hover states.
- **No Generic Tells:** Zero ALL-CAPS English eyebrows above Arabic headings; zero fake `01 / 02 / 03` sequence numbers; zero `→` arrows bolted onto buttons; primary CTAs use crisp Arabic action verbs (`ابدأ تحدي النهاردة`, `افتح محرر الكود`, `كمل الدرس`) with a subtle dual-channel (`cyan`/`pink`) glitch-offset hover animation.
- **Motion Discipline:** One coordinated entrance stagger on `/dashboard` load + responsive interaction feedback (avatar frame preview swap, heatmap day tooltip reveal, CTA glitch edge).

### Gamification Constants & Dashboard Data Contracts
- **5 Rank Tiers (Deterministic XP Curve):**
  1. `newbie` — **مبتدئ كود** (`0 – 999 XP`)
  2. `bug_hunter` — **صياد الأخطاء** (`1,000 – 2,499 XP`)
  3. `code_ninja` — **نينجا البرمجة** (`2,500 – 3,999 XP`)
  4. `cyber_architect` — **مهندس سايبر** (`4,000 – 6,999 XP`)
  5. `grandmaster` — **جراند ماستر** (`7,000+ XP`)
- **4-Stat Radar & Bar Breakdown (`0–100`):** `النظري`, `حل المشكلات`, `سرعة الكود`, `الالتزام`.
- **5 Selectable Avatar Neon Frames:** `obsidian_edge`, `electric_violet`, `cyber_cyan`, `hot_pink`, `solar_glitch`.
- **16-Week (`112`-Day) Activity Heatmap:** Anchored deterministically to a fixed reference date constant (`2026-11-22`) for mock seed generation (zero SSR/CSR hydration drift), rendered as 16 columns x 7 rows (`rtl`-friendly with day-of-week labels and interactive hover/focus tooltips showing Arabic date, XP earned, lessons, and challenges solved).

---

## 8. Folder Structure & Verification Plan

### Modular Directory Layout (`d:\Manasaty`)
```text
d:\Manasaty\
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-11-22-manasaty-phase1-design.md
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql
├── src/
│   ├── middleware.ts
│   ├── types/
│   │   ├── database.ts
│   │   └── gamification.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── gamification/
│   │   │   ├── ranks.ts
│   │   │   └── frames.ts
│   │   ├── supabase/
│   │   │   ├── config.ts
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   └── actions.ts
│   │   └── data/
│   │       ├── mock-dashboard.ts
│   │       └── dashboard.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── cyber-button.tsx
│   │   │   ├── glass-card.tsx
│   │   │   └── motion-provider.tsx
│   │   ├── layout/
│   │   │   ├── navigation-config.ts
│   │   │   ├── cyber-sidebar.tsx
│   │   │   ├── mobile-hud.tsx
│   │   │   ├── mobile-bottom-nav.tsx
│   │   │   └── platform-shell.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   └── dashboard/
│   │       ├── player-stats-card.tsx
│   │       ├── stat-radar-chart.tsx
│   │       ├── activity-heatmap.tsx
│   │       ├── trophy-showcase.tsx
│   │       ├── quick-launch-cards.tsx
│   │       └── phase-placeholder.tsx
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       ├── page.tsx                  # Redirects to /dashboard
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── auth/callback/route.ts
│       └── (platform)/
│           ├── layout.tsx            # Wraps with PlatformShell + active session
│           ├── dashboard/page.tsx    # Complete Phase 1 Student Gamer Dashboard
│           ├── playground/page.tsx   # Phase 2 Shell
│           ├── arena/page.tsx        # Phase 3 Shell
│           ├── courses/page.tsx      # Phase 4 Shell
│           ├── store/page.tsx        # Phase 4 Shell
│           └── admin/page.tsx        # Phase 3/4 Admin Shell (guarded by role === 'admin')
└── tests/
    ├── setup.ts
    ├── ranks.test.ts
    ├── mock-heatmap.test.ts
    ├── schema-migration.test.ts
    └── dashboard-components.test.tsx
```

### Verification Plan (Phase 1 Completion Gates)
1. **Automated Unit, Component & SQL Integrity Tests (`vitest run`):**
   - Rank progression math (`getRankProgress` across boundaries `0`, `999`, `1000`, `2499`, `2500`, `4000`, `7000`, `12000`).
   - Deterministic heatmap generator (112 days, intensity `0..4`, zero `NaN` or hydration non-determinism).
   - SQL Schema structural test verifying all 22 tables exist in `0001_initial_schema.sql`, `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` appear on every table, every FK column has a matching `CREATE INDEX`, `private.is_admin()` grants `EXECUTE` to `authenticated` (not `anon`/`PUBLIC`), and `prevent_student_privileged_field_edits` exists.
   - React Testing Library component checks verifying `dir="ltr"` on code snippets, Arabic RTL rendering of Player Stats Hero Card, Heatmap tooltips, Trophy Showcase (including zero-badge empty state), and Quick Launch Cards.
2. **Production Typecheck & Build (`npx tsc --noEmit` & `npm run build`):**
   - Must succeed with zero TypeScript errors, zero ESLint errors, and zero Next.js App Router build errors without requiring `.env.local`.
3. **Live Browser Verification (Desktop RTL `1440px` + Mobile `390px`):**
   - Start Next.js production/dev server on `d:\Manasaty` and verify `/dashboard`, `/login`, `/register`, `/playground`, `/arena`, `/courses`, `/store`, and `/admin` render cleanly with Arabic `Cairo` font, `JetBrains Mono` LTR code preview, working Neon Avatar Frame switcher, interactive Heatmap tooltips, zero React hydration warnings, and zero console/network errors.

---

## 9. What's Left to the Builder & Architectural Calls Made

### Architectural Calls Made (Available for User Review)
1. **Brand Name:** Named the platform **CodeVerse** matching the target folder `d:\Manasaty`.
2. **Next.js 15 + Tailwind CSS v3.4:** Chosen so everything installs, builds, and runs natively on the machine's Node.js `v18.19.0` without requiring a Node upgrade.
3. **Strict Demo vs Live Auth Boundary:** Cookie-backed Demo Mode (`codeverse_demo_session`) runs automatically only when Supabase env keys are not configured (or explicit dev `ENABLE_DEMO_MODE=true`). When Live Supabase Mode is active, demo cookies are ignored, all `(platform)` routes require Supabase auth via `/login`, `/admin` enforces `public.users.role = 'admin'`, and `/dashboard` queries real database rows with clean Arabic empty states for new students.
4. **22-Table Security-Hardened Schema & Portable Seed:** Separated sensitive paid/grading columns (`lesson_assets`, `challenge_tests`) and added `user_entitlements` alongside the core 19 tables so Phases 2–4 plug in without leaking video URLs or hidden test cases; kept `supabase/seed.sql` strictly on catalog tables (no fragile `auth.users` inserts).
5. **Rank Tier XP Thresholds:** Set to `0` (`newbie`), `1000` (`bug_hunter`), `2500` (`code_ninja`), `4000` (`cyber_architect`), and `7000` (`grandmaster`).
6. **16-Week (`112`-Day) Heatmap Window:** Sized to fit desktop and mobile grids cleanly without horizontal overflow while showcasing realistic streak activity.
7. **PostgreSQL RLS `private.is_admin()` Grants:** Granted `USAGE` on `private` + `EXECUTE` on `private.is_admin()` to `authenticated` (while keeping `private` hidden from PostgREST and splitting `anon` policies) so RLS queries never hit `42501 permission denied`.

### Left to the Builder
- Exact SVG polygon coordinate math for the 4-axis radar chart and custom chamfer clip-path values.
- Exact Tailwind utility spacing, blur, and micro-glow classes within the specified palette tokens.
- Realistic Egyptian Gen Z Arabic microcopy strings across mock courses, daily challenges, and trophy descriptions.
