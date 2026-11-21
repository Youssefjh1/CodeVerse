# CodeVerse Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of **CodeVerse** inside `d:\Manasaty` — Next.js 15 App Router + TypeScript + Cyber/Gaming RTL Design System, complete 22-table PostgreSQL/Supabase schema with strict RLS & portable seed, Auth with Demo Mode fallback, responsive Cyber Sidebar + Mobile HUD/Bottom Nav, and the full Student Gamer Dashboard (`/dashboard`), plus Phase 2–4 placeholder shells.

**Architecture:** Server Components handle session resolution and data loading (`getCurrentSession`, `getDashboardData`), enforcing a strict boundary where cookie-backed Demo Mode (`codeverse_demo_session`) is active only when Supabase env keys are absent (or explicit `ENABLE_DEMO_MODE=true`). Interactive dashboard islands (Neon Avatar Frame switcher, 112-day Activity Heatmap tooltips, Auth forms) live in lean Client Components with zero barrel imports and deterministic data seeding.

**Tech Stack:** Next.js 15 (`^15.5.0`), React 19, TypeScript, Tailwind CSS `^3.4.17`, Framer Motion, Lucide React, `@supabase/supabase-js`, `@supabase/ssr`, Vitest + React Testing Library.

**Spec:** `d:\Manasaty\docs\superpowers\specs\2026-11-22-manasaty-phase1-design.md`

## Global Constraints
- Workspace strictly `d:\Manasaty` (never create/modify anything in `d:\Centerverse`).
- Brand is **CodeVerse** across UI, metadata, `package.json`, and `codeverse_demo_session` cookie.
- Arabic (`dir="rtl"`) UI with `Cairo` font; all code blocks/editor previews/tabular telemetry force `dir="ltr"` with `JetBrains Mono`.
- Dark Mode ONLY (`#09090B` / `#0D0F1A`, glass cards `rgba(20, 24, 40, 0.72)`, `#8B5CF6`, `#06B6D4`, `#EC4899`).
- Node `v18.19.0` runtime constraint -> Next.js 15 + Tailwind v3.4.

## Review Focus
1. Negative XP (`-50`) and overflow XP (`999999`) in `getRankProgress` never yield `NaN`, negative %, or null dereference -> covered in `tests/ranks.test.ts`.
2. Forged `codeverse_demo_session` cookie with `role: "admin"` is completely ignored when `supabaseConfigured && !demoEnabled` -> covered in `tests/auth-boundary.test.ts`.
3. Malformed JSON or unknown enum values in `codeverse_demo_session` fall back cleanly without throwing -> covered in `tests/auth-boundary.test.ts`.
4. `0001_initial_schema.sql` covers all 22 tables, `ENABLE` + `FORCE` RLS on all 22, explicit FK indexes, `(select auth.uid())`, `private.is_admin()` with `authenticated` `EXECUTE` grant, privileged field guard trigger, and portable `seed.sql` -> covered in `tests/schema-migration.test.ts`.
5. Brand-new Live Supabase users (`0` XP, empty badges, empty activity, `null` last lesson) render clean Arabic empty states, and code previews enforce `dir="ltr"` -> covered in `tests/dashboard-components.test.tsx`.

---

### Task 1: Project Scaffold, Cyber Tailwind Theme & Vitest Setup
**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `tests/setup.ts`, `.env.example`, `.gitignore`, `src/app/globals.css`, `src/lib/utils.ts`
**Interfaces:** Produces `cn(...inputs: ClassValue[]): string` in `src/lib/utils.ts`.
- [ ] Write configuration files, Tailwind Cyber tokens (`obsidian`, `cyber-purple`, `cyber-cyan`, `cyber-pink`, `chalk`), `globals.css` (`.glass-panel`, `.cyber-chamfer`, `.code-ltr`, `.glitch-cta`, `prefers-reduced-motion`).
- [ ] Install dependencies (`npm --prefix d:\Manasaty install`) and verify `npm --prefix d:\Manasaty run typecheck` exits 0.
- [ ] Commit: `chore: initialize Next.js 15 project, cyber theme, and Vitest`.

### Task 2: Complete 4-Phase PostgreSQL/Supabase Schema & Portable Seed (TDD)
**Files:** `tests/schema-migration.test.ts`, `supabase/migrations/0001_initial_schema.sql`, `supabase/seed.sql`
- [ ] Write failing structural test `tests/schema-migration.test.ts` verifying all 22 tables, `ENABLE/FORCE ROW LEVEL SECURITY`, FK indexes, `private.is_admin()` grants, triggers, and portable `seed.sql`.
- [ ] Run `npm --prefix d:\Manasaty run test -- tests/schema-migration.test.ts` -> Expected: FAIL.
- [ ] Author `supabase/migrations/0001_initial_schema.sql` and `supabase/seed.sql`.
- [ ] Run `npm --prefix d:\Manasaty run test` -> Expected: PASS.
- [ ] Commit: `feat(db): add complete 4-phase Supabase PostgreSQL schema with RLS and seed`.

### Task 3: Domain Types, Gamification Logic & Deterministic Mock Seed (TDD)
**Files:** `src/types/gamification.ts`, `src/types/database.ts`, `src/lib/gamification/ranks.ts`, `src/lib/gamification/frames.ts`, `src/lib/data/mock-dashboard.ts`, `tests/ranks.test.ts`, `tests/mock-heatmap.test.ts`
**Interfaces:** Produces `getRankForXp`, `getRankProgress`, `RANK_TIERS`, `AVATAR_FRAMES`, `GRADE_LABELS`, `generateDeterministicHeatmap`, `createMockDashboardData`.
- [ ] Write failing `tests/ranks.test.ts` and `tests/mock-heatmap.test.ts` -> verify FAIL.
- [ ] Implement domain types, rank math, frame metadata, and deterministic 112-day mock data.
- [ ] Run `npm --prefix d:\Manasaty run test` -> Expected: PASS.
- [ ] Commit: `feat(gamification): add rank curve, neon avatar frames, and deterministic seed`.

### Task 4: Supabase SSR Clients, Auth/Demo Security Boundary, Actions & Loader (TDD)
**Files:** `src/lib/supabase/config.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/auth/demo-cookie.ts`, `src/lib/auth/session.ts`, `src/lib/auth/actions.ts`, `src/lib/data/dashboard.ts`, `src/middleware.ts`, `tests/auth-boundary.test.ts`
**Interfaces:** Consumes Task 3 types & mock seed. Produces `isSupabaseConfigured`, `isDemoModeEnabled`, `parseDemoSession`, `resolveAccessDecision`, `getCurrentSession`, `getDashboardData`, auth/demo Server Actions.
- [ ] Write failing `tests/auth-boundary.test.ts` -> verify FAIL.
- [ ] Implement Supabase SSR helpers, cookie boundary, middleware, Server Actions, and `getDashboardData`.
- [ ] Run `npm --prefix d:\Manasaty run test` -> Expected: PASS.
- [ ] Commit: `feat(auth): add Supabase SSR auth, strict demo boundary, and dashboard loader`.

### Task 5: Root RTL Layout, Fonts, Cyber UI Primitives & Navigation Shell
**Files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/ui/motion-provider.tsx`, `src/components/ui/glass-card.tsx`, `src/components/ui/cyber-button.tsx`, `src/components/layout/navigation-config.ts`, `src/components/layout/cyber-sidebar.tsx`, `src/components/layout/mobile-hud.tsx`, `src/components/layout/mobile-bottom-nav.tsx`, `src/components/layout/platform-shell.tsx`, `src/app/(platform)/layout.tsx`
- [ ] Implement root `Cairo` + `JetBrains_Mono` RTL layout, reusable primitives, and responsive Cyber Sidebar + Mobile HUD + Bottom Nav.
- [ ] Verify `npm --prefix d:\Manasaty run typecheck` & `npm --prefix d:\Manasaty run test` pass.
- [ ] Commit: `feat(layout): add RTL cyber navigation shell and UI primitives`.

### Task 6: Student Gamer Dashboard (`/dashboard`) & Components (TDD)
**Files:** `tests/dashboard-components.test.tsx`, `src/components/dashboard/stat-radar-chart.tsx`, `src/components/dashboard/player-stats-card.tsx`, `src/components/dashboard/activity-heatmap.tsx`, `src/components/dashboard/trophy-showcase.tsx`, `src/components/dashboard/quick-launch-cards.tsx`, `src/app/(platform)/dashboard/page.tsx`
- [ ] Write failing `tests/dashboard-components.test.tsx` -> verify FAIL.
- [ ] Implement Player Stats Hero Card (with live Neon Frame switcher & SVG Radar), 16-week Heatmap with tooltips, Trophy Showcase (with empty state), Quick Launch Cards (with `dir="ltr"` code preview), and `/dashboard` RSC page.
- [ ] Run `npm --prefix d:\Manasaty run test` -> Expected: PASS.
- [ ] Commit: `feat(dashboard): build CodeVerse student gamer dashboard`.

### Task 7: Auth Screens & Phase 2–4 Placeholder Shells (TDD)
**Files:** `tests/auth-forms.test.tsx`, `src/components/auth/login-form.tsx`, `src/components/auth/register-form.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/auth/callback/route.ts`, `src/components/dashboard/phase-placeholder.tsx`, `src/app/(platform)/{playground,arena,courses,store,admin}/page.tsx`
- [ ] Write failing `tests/auth-forms.test.tsx` -> verify FAIL.
- [ ] Implement `/login`, `/register`, `/auth/callback`, and Phase 2–4 shell routes (with `/admin` role guard).
- [ ] Run `npm --prefix d:\Manasaty run test` -> Expected: PASS.
- [ ] Commit: `feat(auth,routes): add login/register flows and phase 2-4 placeholder shells`.

### Task 8: Full Verification Gate, Live Browser QA & Whole-Branch Review
- [ ] Run `test`, `typecheck`, `lint`, and `build` in `d:\Manasaty` — all exit 0.
- [ ] Start `npm --prefix d:\Manasaty run start -- -p 3000` (`BypassSandbox: true`, `IsDaemon: true`) and inspect `/dashboard`, `/login`, `/register`, and `/playground` across Desktop `1440px` and Mobile `390px` with the `browser` subagent (`Model: "flash"`). Stop server after verification.
- [ ] Dispatch fresh `research` reviewer to review the complete `d:\Manasaty` repo; resolve any Critical/Important findings with TDD and re-verify.
