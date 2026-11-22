-- CodeVerse Complete 4-Phase PostgreSQL / Supabase Migration
-- Follows lowercase snake_case naming, FK B-tree indexing, cached auth.uid() RLS,
-- private.is_admin() privilege isolation, and anti-tampering triggers.

create schema if not exists private;
revoke all on schema private from public;

-- ============================================================================
-- 1. USERS (Core Profile, Role, Grade & Gamification State)
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text unique,
  phone text,
  role text not null default 'student'
    check (role in ('student', 'admin')),
  grade text not null default 'grade_10'
    check (grade in ('grade_10', 'grade_11', 'other')),
  xp bigint not null default 0
    check (xp >= 0),
  coins integer not null default 0
    check (coins >= 0),
  streak integer not null default 0
    check (streak >= 0),
  longest_streak integer not null default 0
    check (longest_streak >= 0),
  rank_tier text not null default 'newbie'
    check (rank_tier in ('newbie', 'bug_hunter', 'code_ninja', 'cyber_architect', 'grandmaster')),
  avatar_frame text not null default 'electric_violet'
    check (avatar_frame in ('obsidian_edge', 'electric_violet', 'cyber_cyan', 'hot_pink', 'solar_glitch')),
  avatar_url text,
  stat_theory smallint not null default 0
    check (stat_theory between 0 and 100),
  stat_problem_solving smallint not null default 0
    check (stat_problem_solving between 0 and 100),
  stat_code_speed smallint not null default 0
    check (stat_code_speed between 0 and 100),
  stat_consistency smallint not null default 0
    check (stat_consistency between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_grade_xp_idx on public.users (grade, xp desc);
create index if not exists users_role_idx on public.users (role);

-- ============================================================================
-- SECURITY HELPERS & TRIGGERS
-- ============================================================================
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

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_grade text;
  safe_name text;
begin
  requested_grade := coalesce(new.raw_user_meta_data ->> 'grade', 'grade_10');
  if requested_grade not in ('grade_10', 'grade_11', 'other') then
    requested_grade := 'grade_10';
  end if;

  safe_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if safe_name is null then
    safe_name := coalesce(split_part(new.email, '@', 1), 'طالب CodeVerse');
  end if;

  insert into public.users (id, full_name, email, phone, role, grade)
  values (
    new.id,
    safe_name,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    'student',
    requested_grade
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

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

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 2. BADGES & 3. USER BADGES
-- ============================================================================
create table if not exists public.badges (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  icon_name text not null,
  rarity text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  xp_reward integer not null default 50
    check (xp_reward >= 0),
  criteria_type text not null,
  criteria_value integer not null default 1
    check (criteria_value >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  badge_id bigint not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx on public.user_badges (user_id, earned_at desc);
create index if not exists user_badges_badge_id_idx on public.user_badges (badge_id);

-- ============================================================================
-- 4. DAILY ACTIVITY (16-Week Heatmap Telemetry)
-- ============================================================================
create table if not exists public.daily_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  activity_date date not null,
  xp_earned integer not null default 0 check (xp_earned >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  challenges_solved integer not null default 0 check (challenges_solved >= 0),
  minutes_studied integer not null default 0 check (minutes_studied >= 0),
  intensity_level smallint not null default 0 check (intensity_level between 0 and 4),
  unique (user_id, activity_date)
);

create index if not exists daily_activity_user_id_idx on public.daily_activity (user_id, activity_date desc);

-- ============================================================================
-- 5. COURSES, 6. LESSONS, 7. LESSON ASSETS, 8. LESSON PROGRESS
-- ============================================================================
create table if not exists public.courses (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  track text not null,
  thumbnail_url text,
  price_egp numeric(10, 2) not null default 0 check (price_egp >= 0),
  is_free boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_grade_published_idx on public.courses (grade, is_published, sort_order);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.handle_updated_at();

create table if not exists public.lessons (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  slug text not null,
  title_ar text not null,
  lesson_type text not null check (lesson_type in ('video', 'interactive_code', 'article', 'quiz')),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  xp_reward integer not null default 50 check (xp_reward >= 0),
  sort_order integer not null default 0,
  is_free_preview boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists lessons_course_id_idx on public.lessons (course_id, sort_order);

create table if not exists public.lesson_assets (
  lesson_id bigint primary key references public.lessons (id) on delete cascade,
  video_storage_path text,
  starter_code text,
  solution_notes text,
  updated_at timestamptz not null default now()
);

drop trigger if exists lesson_assets_set_updated_at on public.lesson_assets;
create trigger lesson_assets_set_updated_at
  before update on public.lesson_assets
  for each row execute function public.handle_updated_at();

create table if not exists public.lesson_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  is_completed boolean not null default false,
  last_accessed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx on public.lesson_progress (user_id, last_accessed_at desc);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

-- ============================================================================
-- 9. QUESTIONS BANK, 10. EXAMS, 11. EXAM ATTEMPTS (Phase 3)
-- ============================================================================
create table if not exists public.questions_bank (
  id bigint generated always as identity primary key,
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  topic text not null,
  question_type text not null check (question_type in ('mcq', 'fact_or_cap', 'debug_duel', 'output_rush')),
  prompt_ar text not null,
  code_snippet text,
  language text not null default 'python' check (language in ('python', 'javascript', 'cpp', 'pseudocode', 'sql')),
  options_json jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation_ar text not null default '',
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_pdf_name text,
  ai_generated boolean not null default false,
  is_approved boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists questions_bank_grade_topic_idx on public.questions_bank (grade, topic, difficulty);
create index if not exists questions_bank_created_by_idx on public.questions_bank (created_by);

create table if not exists public.exams (
  id bigint generated always as identity primary key,
  title_ar text not null,
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  exam_cadence text not null check (exam_cadence in ('weekly', 'monthly', 'practice')),
  question_ids bigint[] not null default '{}'::bigint[],
  duration_minutes integer not null check (duration_minutes > 0),
  xp_reward integer not null default 150 check (xp_reward >= 0),
  coins_reward integer not null default 50 check (coins_reward >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists exams_grade_window_idx on public.exams (grade, is_published, starts_at);
create index if not exists exams_created_by_idx on public.exams (created_by);

create table if not exists public.exam_attempts (
  id bigint generated always as identity primary key,
  exam_id bigint not null references public.exams (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  answers_json jsonb not null default '{}'::jsonb,
  score_percent numeric(5, 2) not null default 0 check (score_percent between 0 and 100),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists exam_attempts_exam_id_idx on public.exam_attempts (exam_id);
create index if not exists exam_attempts_user_id_idx on public.exam_attempts (user_id, submitted_at desc);

-- ============================================================================
-- 12. CHALLENGES, 13. CHALLENGE TESTS, 14. CHALLENGE SUBMISSIONS (Phase 1-3)
-- ============================================================================
create table if not exists public.challenges (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  mode text not null check (mode in ('daily', 'fact_or_cap', 'debug_duel', 'output_rush', 'flash_blitz_1v1')),
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  language text not null check (language in ('python', 'javascript', 'cpp', 'pseudocode')),
  starter_code text not null default '',
  xp_reward integer not null default 100 check (xp_reward >= 0),
  coins_reward integer not null default 25 check (coins_reward >= 0),
  time_limit_seconds integer not null default 300 check (time_limit_seconds > 0),
  active_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists challenges_mode_active_idx on public.challenges (mode, is_active, active_date);

create table if not exists public.challenge_tests (
  id bigint generated always as identity primary key,
  challenge_id bigint not null references public.challenges (id) on delete cascade,
  is_sample boolean not null default false,
  input_data text not null default '',
  expected_output text not null,
  sort_order integer not null default 0
);

create index if not exists challenge_tests_challenge_idx on public.challenge_tests (challenge_id, is_sample, sort_order);

create table if not exists public.challenge_submissions (
  id bigint generated always as identity primary key,
  challenge_id bigint not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  submitted_code text not null,
  is_passed boolean not null default false,
  execution_ms integer not null default 0 check (execution_ms >= 0),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  coins_awarded integer not null default 0 check (coins_awarded >= 0),
  created_at timestamptz not null default now()
);

create index if not exists challenge_submissions_challenge_id_idx on public.challenge_submissions (challenge_id);
create index if not exists challenge_submissions_user_id_idx on public.challenge_submissions (user_id, created_at desc);

-- ============================================================================
-- 15. PRODUCTS, 16. PACKAGES, 17. PACKAGE ITEMS (Phase 4)
-- ============================================================================
create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  product_type text not null check (product_type in ('pdf_note', 'printed_book')),
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  price_egp numeric(10, 2) not null check (price_egp >= 0),
  storage_path text,
  stock_count integer check (stock_count is null or stock_count >= 0),
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_type_grade_idx on public.products (product_type, grade, is_active);

create table if not exists public.packages (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  grade text not null check (grade in ('grade_10', 'grade_11', 'other', 'all')),
  price_egp numeric(10, 2) not null check (price_egp >= 0),
  discount_percent smallint not null default 0 check (discount_percent between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists packages_grade_active_idx on public.packages (grade, is_active);

create table if not exists public.package_items (
  id bigint generated always as identity primary key,
  package_id bigint not null references public.packages (id) on delete cascade,
  item_type text not null check (item_type in ('course', 'product')),
  course_id bigint references public.courses (id) on delete cascade,
  product_id bigint references public.products (id) on delete cascade,
  constraint package_items_exclusive_target check (
    (item_type = 'course' and course_id is not null and product_id is null)
    or (item_type = 'product' and product_id is not null and course_id is null)
  )
);

create index if not exists package_items_package_id_idx on public.package_items (package_id);
create index if not exists package_items_course_id_idx on public.package_items (course_id);
create index if not exists package_items_product_id_idx on public.package_items (product_id);

-- ============================================================================
-- 18. VOUCHERS, 19. VOUCHER REDEMPTIONS, 20. ORDERS, 21. ORDER ITEMS, 22. USER ENTITLEMENTS
-- ============================================================================
create table if not exists public.vouchers (
  id bigint generated always as identity primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed_egp', 'full_unlock')),
  discount_value numeric(10, 2) not null default 0 check (discount_value >= 0),
  applies_to text not null default 'all' check (applies_to in ('all', 'course', 'product', 'package')),
  target_id bigint,
  max_uses integer not null default 1 check (max_uses >= 1),
  current_uses integer not null default 0 check (current_uses >= 0 and current_uses <= max_uses),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method text not null check (payment_method in ('paymob', 'fawry', 'voucher', 'cod')),
  payment_reference text,
  subtotal_egp numeric(10, 2) not null check (subtotal_egp >= 0),
  discount_egp numeric(10, 2) not null default 0 check (discount_egp >= 0),
  total_egp numeric(10, 2) not null check (total_egp >= 0),
  voucher_id bigint references public.vouchers (id) on delete set null,
  shipping_name text,
  shipping_phone text,
  shipping_governorate text,
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);
create index if not exists orders_voucher_id_idx on public.orders (voucher_id);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create table if not exists public.voucher_redemptions (
  id bigint generated always as identity primary key,
  voucher_id bigint not null references public.vouchers (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  order_id bigint references public.orders (id) on delete set null,
  redeemed_at timestamptz not null default now(),
  unique (voucher_id, user_id)
);

create index if not exists voucher_redemptions_voucher_id_idx on public.voucher_redemptions (voucher_id);
create index if not exists voucher_redemptions_user_id_idx on public.voucher_redemptions (user_id);
create index if not exists voucher_redemptions_order_id_idx on public.voucher_redemptions (order_id);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  item_type text not null check (item_type in ('course', 'product', 'package')),
  course_id bigint references public.courses (id) on delete set null,
  product_id bigint references public.products (id) on delete set null,
  package_id bigint references public.packages (id) on delete set null,
  unit_price_egp numeric(10, 2) not null check (unit_price_egp >= 0),
  quantity integer not null default 1 check (quantity >= 1),
  constraint order_items_single_target check (
    (item_type = 'course' and course_id is not null and product_id is null and package_id is null)
    or (item_type = 'product' and product_id is not null and course_id is null and package_id is null)
    or (item_type = 'package' and package_id is not null and course_id is null and product_id is null)
  )
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_course_id_idx on public.order_items (course_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists order_items_package_id_idx on public.order_items (package_id);

create table if not exists public.user_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  item_type text not null check (item_type in ('course', 'product')),
  course_id bigint references public.courses (id) on delete cascade,
  product_id bigint references public.products (id) on delete cascade,
  source text not null check (source in ('order', 'voucher', 'package', 'admin_grant')),
  order_id bigint references public.orders (id) on delete set null,
  voucher_id bigint references public.vouchers (id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint user_entitlements_exclusive_target check (
    (item_type = 'course' and course_id is not null and product_id is null)
    or (item_type = 'product' and product_id is not null and course_id is null)
  )
);

create unique index if not exists user_entitlements_user_course_uniq
  on public.user_entitlements (user_id, course_id) where course_id is not null;
create unique index if not exists user_entitlements_user_product_uniq
  on public.user_entitlements (user_id, product_id) where product_id is not null;
create index if not exists user_entitlements_user_id_idx on public.user_entitlements (user_id);
create index if not exists user_entitlements_course_id_idx on public.user_entitlements (course_id);
create index if not exists user_entitlements_product_id_idx on public.user_entitlements (product_id);
create index if not exists user_entitlements_order_id_idx on public.user_entitlements (order_id);
create index if not exists user_entitlements_voucher_id_idx on public.user_entitlements (voucher_id);

-- ============================================================================
-- ENABLE & FORCE ROW LEVEL SECURITY ON ALL 22 PUBLIC TABLES
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
-- RLS POLICIES (auth.uid() cached in subselect; anon split from private.is_admin)
-- ============================================================================

-- 1. users
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

-- 2. badges
create policy badges_public_read on public.badges
  for select to anon, authenticated
  using (true);

create policy badges_admin_all on public.badges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 3. user_badges
create policy user_badges_select_own on public.user_badges
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_badges_admin_all on public.user_badges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 4. daily_activity
create policy daily_activity_select_own on public.daily_activity
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy daily_activity_admin_all on public.daily_activity
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 5. courses
create policy courses_public_read on public.courses
  for select to anon, authenticated
  using (is_published = true);

create policy courses_admin_all on public.courses
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 6. lessons
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

-- 7. lesson_assets (gated by free preview, active entitlement, or admin)
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

-- 8. lesson_progress
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

-- 9. questions_bank (admin-only direct access so answers/explanations never leak)
create policy questions_bank_admin_all on public.questions_bank
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 10. exams
create policy exams_authenticated_read on public.exams
  for select to authenticated
  using (is_published = true);

create policy exams_admin_all on public.exams
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 11. exam_attempts
create policy exam_attempts_select_own on public.exam_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy exam_attempts_insert_own on public.exam_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy exam_attempts_admin_all on public.exam_attempts
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 12. challenges
create policy challenges_public_read on public.challenges
  for select to anon, authenticated
  using (is_active = true);

create policy challenges_admin_all on public.challenges
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 13. challenge_tests (students read sample test cases only; hidden tests stay admin/server-only)
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

-- 14. challenge_submissions
create policy challenge_submissions_select_own on public.challenge_submissions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy challenge_submissions_insert_own on public.challenge_submissions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy challenge_submissions_admin_all on public.challenge_submissions
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 15. products
create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_active = true);

create policy products_admin_all on public.products
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 16. packages
create policy packages_public_read on public.packages
  for select to anon, authenticated
  using (is_active = true);

create policy packages_admin_all on public.packages
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 17. package_items
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

-- 18. vouchers (admin-only direct visibility; redemption runs via server route/RPC)
create policy vouchers_admin_all on public.vouchers
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 19. voucher_redemptions
create policy voucher_redemptions_select_own on public.voucher_redemptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy voucher_redemptions_admin_all on public.voucher_redemptions
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 20. orders
create policy orders_select_own on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy orders_admin_all on public.orders
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 21. order_items
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

-- 22. user_entitlements
create policy user_entitlements_select_own on public.user_entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_entitlements_admin_all on public.user_entitlements
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
