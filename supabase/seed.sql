-- CodeVerse Portable Catalog Seed
-- Seeds public catalog tables idempotently (safe for local reset & hosted Supabase Studio).
-- Does NOT insert synthetic auth.users rows.
--
-- To promote a registered account to Admin, run in SQL Editor:
--   update public.users set role = 'admin' where email = 'admin@codeverse.eg';

insert into public.badges (slug, title_ar, description_ar, icon_name, rarity, xp_reward, criteria_type, criteria_value)
values
  ('first-commit', 'أول سطر كود', 'أنهيت أول تمرين برمجي بنجاح بدون أخطاء', 'Terminal', 'common', 100, 'challenges_solved', 1),
  ('streak-7', 'شعلة الأسبوع', 'حافظت على سلسلة مذاكرة 7 أيام متواصلة', 'Flame', 'rare', 250, 'streak_days', 7),
  ('bug-slayer', 'قناص البجز', 'اكتشفت وأصلحت 15 خطأ برمجي في ساحة التحديات', 'Bug', 'epic', 500, 'debug_duels_won', 15),
  ('theory-ace', 'أستاذ النظري', 'حققت 95% فأعلى في اختبار علوم الحاسب الشهري', 'Cpu', 'legendary', 800, 'exam_score', 95)
on conflict (slug) do nothing;

insert into public.courses (slug, title_ar, description_ar, grade, track, price_egp, is_free, is_published, sort_order)
values
  (
    'grade10-python-foundations',
    'أساسيات البرمجة ببايثون — أولى ثانوي',
    'رحلة تفاعلية من الصفر لحد الحلقات التكرارية والدوال وحل المسائل خطوة بخطوة.',
    'grade_10',
    'programming',
    0.00,
    true,
    true,
    1
  ),
  (
    'grade11-algorithms-logic',
    'الخوارزميات وهياكل البيانات — تانية ثانوي',
    'فهم البحث الثنائي والترتيب والتفكير الخوارزمي بتطبيقات عملية سريعة.',
    'grade_11',
    'cs_theory',
    290.00,
    false,
    true,
    2
  )
on conflict (slug) do nothing;

insert into public.lessons (course_id, slug, title_ar, lesson_type, duration_seconds, xp_reward, sort_order, is_free_preview, is_published)
select c.id, 'intro-variables-io', 'المتغيرات والإدخال والإخراج في Python', 'interactive_code', 900, 80, 1, true, true
from public.courses c where c.slug = 'grade10-python-foundations'
on conflict (course_id, slug) do nothing;

insert into public.lessons (course_id, slug, title_ar, lesson_type, duration_seconds, xp_reward, sort_order, is_free_preview, is_published)
select c.id, 'binary-search-visual', 'البحث الثنائي Binary Search بالرسم', 'video', 1420, 120, 1, true, true
from public.courses c where c.slug = 'grade11-algorithms-logic'
on conflict (course_id, slug) do nothing;

insert into public.lesson_assets (lesson_id, starter_code, solution_notes)
select l.id,
  E'name = "CodeVerse"\nscore = 100\nprint(f"أهلاً بك في {name} — رصيدك: {score} XP")',
  'استخدم f-strings لدمج المتغيرات النصية والرقمية بأناقة.'
from public.lessons l where l.slug = 'intro-variables-io'
on conflict (lesson_id) do nothing;

insert into public.lesson_assets (lesson_id, starter_code, solution_notes)
select l.id,
  E'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1',
  'التعقيد الزمني للبحث الثنائي O(log n) بشرط ترتيب المصفوفة.'
from public.lessons l where l.slug = 'binary-search-visual'
on conflict (lesson_id) do nothing;

insert into public.challenges (slug, title_ar, description_ar, mode, grade, difficulty, language, starter_code, xp_reward, coins_reward, time_limit_seconds, is_active)
values
  (
    'daily-even-sum',
    'مجموع الأرقام الزوجية',
    'اكتب دالة تجمع كل الأرقام الزوجية في القائمة وتطبع الناتج النهائي.',
    'daily',
    'all',
    'easy',
    'python',
    E'def sum_evens(nums):\n    # اكتب الحل هنا\n    return sum(n for n in nums if n % 2 == 0)\n\nprint(sum_evens([2, 5, 8, 11, 14]))',
    150,
    40,
    300,
    true
  ),
  (
    'debug-loop-limit',
    'أصلح حلقة العدّ اللانهائية',
    'الكود الحالي بيقف قبل آخر عنصر في القائمة. اكتشف الخطأ وصلّحه.',
    'debug_duel',
    'grade_10',
    'medium',
    'python',
    E'items = [10, 20, 30, 40]\nfor i in range(len(items) - 1):\n    print(items[i])',
    200,
    60,
    240,
    true
  )
on conflict (slug) do nothing;

insert into public.challenge_tests (challenge_id, is_sample, input_data, expected_output, sort_order)
select c.id, true, '[2, 5, 8, 11, 14]', '24', 1
from public.challenges c where c.slug = 'daily-even-sum'
and not exists (
  select 1 from public.challenge_tests ct where ct.challenge_id = c.id and ct.sort_order = 1
);

insert into public.products (slug, title_ar, description_ar, product_type, grade, price_egp, stock_count, is_active)
values
  (
    'grade11-cs-summary-pdf',
    'ملزمة السايبر الشاملة — نظري تانية ثانوي',
    'ملخص مركز بالخرائط الذهنية وأسئلة الامتحانات المتوقعة (PDF محمي).',
    'pdf_note',
    'grade_11',
    85.00,
    null,
    true
  ),
  (
    'grade10-algo-printed-book',
    'كتاب CodeVerse المطبوع — أسس الخوارزميات',
    'نسخة مطبوعة فاخرة بالألوان + كود تفعيل هدية للتحديات.',
    'printed_book',
    'grade_10',
    220.00,
    120,
    true
  )
on conflict (slug) do nothing;

insert into public.packages (slug, title_ar, description_ar, grade, price_egp, discount_percent, is_active)
values
  (
    'term1-starter-bundle',
    'باقة بداية الترم الأول',
    'كورس الأساسيات + ملزمة السايبر الشاملة بخصم خاص.',
    'grade_11',
    310.00,
    18,
    true
  )
on conflict (slug) do nothing;

insert into public.package_items (package_id, item_type, course_id)
select p.id, 'course', c.id
from public.packages p
join public.courses c on c.slug = 'grade11-algorithms-logic'
where p.slug = 'term1-starter-bundle'
and not exists (
  select 1 from public.package_items pi where pi.package_id = p.id and pi.course_id = c.id
);

-- Test/promo voucher for dev & staging environments; strictly blocked in production
-- unless ALLOW_DEMO_MODE=true is explicitly set.
insert into public.vouchers (code, discount_type, discount_value, applies_to, max_uses, is_active)
values
  ('CODEVERSE20', 'percent', 20.00, 'all', 250, true)
on conflict (code) do nothing;

-- ============================================================================
-- Phase 3 Starter Questions Bank (idempotent without synthetic auth.users)
-- ============================================================================
insert into public.questions_bank (
  grade, topic, question_type, prompt_ar, code_snippet, language,
  options_json, correct_answer, explanation_ar, difficulty, source_pdf_name, ai_generated, is_approved
)
select
  'grade_10', 'أساسيات بايثون', 'fact_or_cap',
  'في لغة بايثون، نتيجة تنفيذ expression: type(10 / 2) هي float وليست int.',
  'print(type(10 / 2))', 'python',
  '["حقيقة", "هبد"]'::jsonb, 'حقيقة',
  'القسمة العادية `/` في Python تعيد دائماً عدداً عشرياً (float) مثل 5.0، بينما `//` تعيد عدداً صحيحاً.',
  'easy', 'seed-curriculum.pdf', false, true
where not exists (
  select 1 from public.questions_bank where topic = 'أساسيات بايثون' and question_type = 'fact_or_cap'
);

insert into public.questions_bank (
  grade, topic, question_type, prompt_ar, code_snippet, language,
  options_json, correct_answer, explanation_ar, difficulty, source_pdf_name, ai_generated, is_approved
)
select
  'grade_11', 'الخوارزميات', 'output_rush',
  'ما المخرج النهائي للكود التالي؟',
  E'nums = [2, 4, 6]\nprint(sum(nums) // len(nums))', 'python',
  '["4", "6", "12", "3"]'::jsonb, '4',
  'مجموع العناصر 12 وعددها 3، وبالتالي 12 // 3 يساوي 4.',
  'medium', 'seed-curriculum.pdf', false, true
where not exists (
  select 1 from public.questions_bank where topic = 'الخوارزميات' and question_type = 'output_rush'
);

insert into public.questions_bank (
  grade, topic, question_type, prompt_ar, code_snippet, language,
  options_json, correct_answer, explanation_ar, difficulty, source_pdf_name, ai_generated, is_approved
)
select
  'grade_10', 'تمثيل البيانات', 'mcq',
  'كم بت (Bit) يوجد في 2 بايت (Byte)؟',
  null, 'pseudocode',
  '["8 بت", "16 بت", "32 بت", "4 بت"]'::jsonb, '16 بت',
  'كل 1 بايت يتكون من 8 بت، إذن 2 بايت = 16 بت.',
  'easy', 'seed-curriculum.pdf', false, true
where not exists (
  select 1 from public.questions_bank where topic = 'تمثيل البيانات' and question_type = 'mcq'
);
