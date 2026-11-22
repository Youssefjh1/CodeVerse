-- CodeVerse Production Row Level Security (RLS) & Privilege Hardening Script
-- Run idempotently on Supabase Postgres after migrations (and before launch).
-- Design rules enforced:
--   1. Every public table has ENABLE + FORCE ROW LEVEL SECURITY.
--   2. Every auth.uid() lookup is cached via (select auth.uid()) per statement.
--   3. private.is_admin() runs SECURITY DEFINER with empty search_path; anon has zero execute.
--   4. Direct anon/student mutation of privileged tables (vouchers, questions_bank, exams,
--      user_entitlements, enrollments, orders, users.xp/coins/role) is blocked at DB level.

-- ============================================================================
-- 1. PRIVATE SCHEMA & ADMIN HELPER HARDENING
-- ============================================================================
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'admin'
    );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- ============================================================================
-- 2. LEAST-PRIVILEGE GRANTS (LOCK DOWN ANON)
-- ============================================================================
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke select on
  public.users,
  public.user_badges,
  public.daily_activity,
  public.lesson_assets,
  public.lesson_progress,
  public.questions_bank,
  public.exams,
  public.exam_attempts,
  public.challenge_tests,
  public.challenge_submissions,
  public.vouchers,
  public.voucher_redemptions,
  public.orders,
  public.order_items,
  public.user_entitlements
from anon;

-- ============================================================================
-- 3. ANTI-TAMPERING TRIGGER ON PUBLIC.USERS (PROTECT XP, COINS, ROLE, STATS)
-- ============================================================================
create or replace function public.prevent_student_privileged_field_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if (select private.is_admin()) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.xp is distinct from old.xp
     or new.coins is distinct from old.coins
     or new.streak is distinct from old.streak
     or new.longest_streak is distinct from old.longest_streak
     or new.rank_tier is distinct from old.rank_tier
     or new.stat_theory is distinct from old.stat_theory
     or new.stat_problem_solving is distinct from old.stat_problem_solving
     or new.stat_code_speed is distinct from old.stat_code_speed
     or new.stat_consistency is distinct from old.stat_consistency then
    raise exception 'Permission denied: students cannot modify privileged gamification or role fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists users_guard_privileged_fields on public.users;
create trigger users_guard_privileged_fields
  before update on public.users
  for each row execute function public.prevent_student_privileged_field_edits();

-- ============================================================================
-- 4. ENABLE & FORCE RLS ON ALL 22 PUBLIC TABLES
-- ============================================================================
alter table public.users enable row level security;
alter table public.users force row level security;

alter table public.badges enable row level security;
alter table public.badges force row level security;

alter table public.user_badges enable row level security;
alter table public.user_badges force row level security;

alter table public.daily_activity enable row level security;
alter table public.daily_activity force row level security;

alter table public.courses enable row level security;
alter table public.courses force row level security;

alter table public.lessons enable row level security;
alter table public.lessons force row level security;

alter table public.lesson_assets enable row level security;
alter table public.lesson_assets force row level security;

alter table public.lesson_progress enable row level security;
alter table public.lesson_progress force row level security;

alter table public.questions_bank enable row level security;
alter table public.questions_bank force row level security;

alter table public.exams enable row level security;
alter table public.exams force row level security;

alter table public.exam_attempts enable row level security;
alter table public.exam_attempts force row level security;

alter table public.challenges enable row level security;
alter table public.challenges force row level security;

alter table public.challenge_tests enable row level security;
alter table public.challenge_tests force row level security;

alter table public.challenge_submissions enable row level security;
alter table public.challenge_submissions force row level security;

alter table public.products enable row level security;
alter table public.products force row level security;

alter table public.packages enable row level security;
alter table public.packages force row level security;

alter table public.package_items enable row level security;
alter table public.package_items force row level security;

alter table public.vouchers enable row level security;
alter table public.vouchers force row level security;

alter table public.voucher_redemptions enable row level security;
alter table public.voucher_redemptions force row level security;

alter table public.orders enable row level security;
alter table public.orders force row level security;

alter table public.order_items enable row level security;
alter table public.order_items force row level security;

alter table public.user_entitlements enable row level security;
alter table public.user_entitlements force row level security;

-- ============================================================================
-- 5. PROTECTED ENROLLMENTS VIEW (SECURITY INVOKER OVER USER_ENTITLEMENTS)
-- ============================================================================
create or replace view public.enrollments
with (security_invoker = true) as
select
  ue.id,
  ue.user_id,
  ue.course_id,
  ue.source,
  ue.order_id,
  ue.voucher_id,
  ue.granted_at,
  ue.expires_at
from public.user_entitlements ue
where ue.item_type = 'course'
  and ue.course_id is not null;

revoke all on public.enrollments from public, anon;
grant select on public.enrollments to authenticated, service_role;

-- ============================================================================
-- 6. IDEMPOTENT RLS POLICIES ACROSS ALL 22 TABLES
-- ============================================================================

-- 6.1 users (read own profile, update safe profile fields only; admin full access)
drop policy if exists users_select_own on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists users_admin_all on public.users;

create policy users_select_own on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy users_update_own on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy users_admin_all on public.users
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.2 badges
drop policy if exists badges_public_read on public.badges;
drop policy if exists badges_admin_all on public.badges;

create policy badges_public_read on public.badges
  for select to anon, authenticated
  using (true);

create policy badges_admin_all on public.badges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.3 user_badges (read own earned badges only; server/admin awards badges)
drop policy if exists user_badges_select_own on public.user_badges;
drop policy if exists user_badges_admin_all on public.user_badges;

create policy user_badges_select_own on public.user_badges
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_badges_admin_all on public.user_badges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.4 daily_activity (read own telemetry only; server records XP & streaks)
drop policy if exists daily_activity_select_own on public.daily_activity;
drop policy if exists daily_activity_admin_all on public.daily_activity;

create policy daily_activity_select_own on public.daily_activity
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy daily_activity_admin_all on public.daily_activity
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.5 courses
drop policy if exists courses_public_read on public.courses;
drop policy if exists courses_admin_all on public.courses;

create policy courses_public_read on public.courses
  for select to anon, authenticated
  using (is_published = true);

create policy courses_admin_all on public.courses
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.6 lessons
drop policy if exists lessons_public_read on public.lessons;
drop policy if exists lessons_admin_all on public.lessons;

create policy lessons_public_read on public.lessons
  for select to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

create policy lessons_admin_all on public.lessons
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.7 lesson_assets (strictly gated by free preview or active course entitlement)
drop policy if exists lesson_assets_entitled_read on public.lesson_assets;
drop policy if exists lesson_assets_admin_all on public.lesson_assets;

create policy lesson_assets_entitled_read on public.lesson_assets
  for select to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id
        and l.is_published = true
        and c.is_published = true
        and (
          l.is_free_preview = true
          or c.is_free = true
          or exists (
            select 1
            from public.user_entitlements ue
            where ue.user_id = (select auth.uid())
              and ue.course_id = c.id
              and (ue.expires_at is null or ue.expires_at > now())
          )
        )
    )
  );

create policy lesson_assets_admin_all on public.lesson_assets
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.8 lesson_progress
drop policy if exists lesson_progress_own_read on public.lesson_progress;
drop policy if exists lesson_progress_own_write on public.lesson_progress;
drop policy if exists lesson_progress_own_update on public.lesson_progress;
drop policy if exists lesson_progress_admin_all on public.lesson_progress;

create policy lesson_progress_own_read on public.lesson_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy lesson_progress_own_write on public.lesson_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy lesson_progress_own_update on public.lesson_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy lesson_progress_admin_all on public.lesson_progress
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.9 questions_bank (strictly admin/server-only so students NEVER read exam answers)
drop policy if exists questions_bank_public_read on public.questions_bank;
drop policy if exists questions_bank_authenticated_read on public.questions_bank;
drop policy if exists questions_bank_admin_all on public.questions_bank;

create policy questions_bank_admin_all on public.questions_bank
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.10 exams (students can read published exams only; admin creates/updates)
drop policy if exists exams_authenticated_read on public.exams;
drop policy if exists exams_admin_all on public.exams;

create policy exams_authenticated_read on public.exams
  for select to authenticated
  using (is_published = true);

create policy exams_admin_all on public.exams
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.11 exam_attempts (read own graded attempts only; server writes verified scores via service_role)
drop policy if exists exam_attempts_select_own on public.exam_attempts;
drop policy if exists exam_attempts_insert_own on public.exam_attempts;
drop policy if exists exam_attempts_admin_all on public.exam_attempts;

create policy exam_attempts_select_own on public.exam_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy exam_attempts_admin_all on public.exam_attempts
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.12 challenges
drop policy if exists challenges_public_read on public.challenges;
drop policy if exists challenges_admin_all on public.challenges;

create policy challenges_public_read on public.challenges
  for select to anon, authenticated
  using (is_active = true);

create policy challenges_admin_all on public.challenges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.13 challenge_tests (hidden evaluation cases stay admin/server-only)
drop policy if exists challenge_tests_sample_read on public.challenge_tests;
drop policy if exists challenge_tests_admin_all on public.challenge_tests;

create policy challenge_tests_sample_read on public.challenge_tests
  for select to authenticated
  using (
    is_sample = true
    and exists (
      select 1 from public.challenges ch
      where ch.id = challenge_id and ch.is_active = true
    )
  );

create policy challenge_tests_admin_all on public.challenge_tests
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.14 challenge_submissions (students cannot self-mark is_passed=true or grant xp/coins)
drop policy if exists challenge_submissions_select_own on public.challenge_submissions;
drop policy if exists challenge_submissions_insert_own on public.challenge_submissions;
drop policy if exists challenge_submissions_admin_all on public.challenge_submissions;

create policy challenge_submissions_select_own on public.challenge_submissions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy challenge_submissions_insert_own on public.challenge_submissions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and is_passed = false
    and xp_awarded = 0
    and coins_awarded = 0
  );

create policy challenge_submissions_admin_all on public.challenge_submissions
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.15 products
drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_all on public.products;

create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_active = true);

create policy products_admin_all on public.products
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.16 packages
drop policy if exists packages_public_read on public.packages;
drop policy if exists packages_admin_all on public.packages;

create policy packages_public_read on public.packages
  for select to anon, authenticated
  using (is_active = true);

create policy packages_admin_all on public.packages
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.17 package_items
drop policy if exists package_items_public_read on public.package_items;
drop policy if exists package_items_admin_all on public.package_items;

create policy package_items_public_read on public.package_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.is_active = true
    )
  );

create policy package_items_admin_all on public.package_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.18 vouchers (admin/server-only; prevents voucher enumeration by students)
drop policy if exists vouchers_public_read on public.vouchers;
drop policy if exists vouchers_admin_all on public.vouchers;

create policy vouchers_admin_all on public.vouchers
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.19 voucher_redemptions (students read own redemptions only)
drop policy if exists voucher_redemptions_select_own on public.voucher_redemptions;
drop policy if exists voucher_redemptions_admin_all on public.voucher_redemptions;

create policy voucher_redemptions_select_own on public.voucher_redemptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy voucher_redemptions_admin_all on public.voucher_redemptions
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.20 orders (students read own orders only; checkout API writes via service_role)
drop policy if exists orders_select_own on public.orders;
drop policy if exists orders_insert_own on public.orders;
drop policy if exists orders_update_own on public.orders;
drop policy if exists orders_admin_all on public.orders;

create policy orders_select_own on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy orders_admin_all on public.orders
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.21 order_items (students read own order line items only)
drop policy if exists order_items_select_own on public.order_items;
drop policy if exists order_items_admin_all on public.order_items;

create policy order_items_select_own on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy order_items_admin_all on public.order_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6.22 user_entitlements / enrollments (students read own grants only; server grants after verified payment/voucher)
drop policy if exists user_entitlements_select_own on public.user_entitlements;
drop policy if exists user_entitlements_insert_own on public.user_entitlements;
drop policy if exists user_entitlements_admin_all on public.user_entitlements;

create policy user_entitlements_select_own on public.user_entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_entitlements_admin_all on public.user_entitlements
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
