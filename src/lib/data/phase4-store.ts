import { revalidatePath } from "next/cache";
import {
  calculateVoucherDiscount,
  generateBatchVoucherCodes,
  normalizeVoucherCode,
} from "@/lib/commerce/vouchers";
import { isFawryConfigured } from "@/lib/payments/fawry";
import { isPaymobConfigured } from "@/lib/payments/paymob";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isBlockedTestVoucherCode,
  isDemoModeEnabled,
} from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminCommerceBootstrapData,
  CourseDetail,
  CourseLessonItem,
  CoursesBootstrapData,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  StoreBootstrapData,
  StorePackage,
  StoreProduct,
  VoucherAppliesTo,
  VoucherDiscountType,
  VoucherRecord,
} from "@/types/commerce";
import type { UserSession } from "@/types/gamification";

const SEEDED_COURSES: CourseDetail[] = [
  {
    id: 1,
    slug: "grade10-python-foundations",
    titleAr: "أساسيات البرمجة ببايثون — أولى ثانوي",
    descriptionAr:
      "رحلة تفاعلية من الصفر لحد الحلقات التكرارية والدوال وحل المسائل خطوة بخطوة.",
    grade: "grade_10",
    track: "programming",
    priceEgp: 0,
    isFree: true,
    isEntitled: true,
    lessons: [
      {
        id: 101,
        courseId: 1,
        slug: "intro-variables-io",
        titleAr: "المتغيرات والإدخال والإخراج في Python",
        lessonType: "interactive_code",
        durationSeconds: 900,
        durationLabelAr: "15 دقيقة",
        xpReward: 80,
        sortOrder: 1,
        isFreePreview: true,
        bunnyVideoId: null,
        starterCode:
          'name = "CodeVerse"\nscore = 100\nprint(f"أهلاً بك في {name} — رصيدك: {score} XP")',
        solutionNotes: "استخدم f-strings لدمج المتغيرات النصية والرقمية بأناقة.",
        isUnlocked: true,
        isCompleted: false,
      },
      {
        id: 102,
        courseId: 1,
        slug: "conditions-branching",
        titleAr: "الشروط المنطقية والتفرع if / elif / else",
        lessonType: "video",
        durationSeconds: 1140,
        durationLabelAr: "19 دقيقة",
        xpReward: 95,
        sortOrder: 2,
        isFreePreview: true,
        bunnyVideoId: null,
        starterCode: 'score = 88\nif score >= 85:\n    print("امتياز")',
        solutionNotes: "رتّب الشروط من الأكبر للأصغر حتى لا يتخطى الشرط العام الحالة الخاصة.",
        isUnlocked: true,
        isCompleted: false,
      },
      {
        id: 103,
        courseId: 1,
        slug: "for-while-loops",
        titleAr: "حلقات التكرار for و while عملياً",
        lessonType: "video",
        durationSeconds: 1320,
        durationLabelAr: "22 دقيقة",
        xpReward: 110,
        sortOrder: 3,
        isFreePreview: true,
        bunnyVideoId: null,
        starterCode: "for i in range(1, 6):\n    print(i * i)",
        solutionNotes: "دالة range(a, b) تتوقف قبل الرقم b مباشرة.",
        isUnlocked: true,
        isCompleted: false,
      },
    ],
  },
  {
    id: 2,
    slug: "grade11-algorithms-logic",
    titleAr: "الخوارزميات وهياكل البيانات — تانية ثانوي",
    descriptionAr:
      "فهم البحث الثنائي والترتيب والتفكير الخوارزمي وهياكل Stack و Queue بتطبيقات عملية.",
    grade: "grade_11",
    track: "cs_theory",
    priceEgp: 290,
    isFree: false,
    isEntitled: false,
    lessons: [
      {
        id: 201,
        courseId: 2,
        slug: "binary-search-visual",
        titleAr: "البحث الثنائي Binary Search بالرسم",
        lessonType: "video",
        durationSeconds: 1420,
        durationLabelAr: "24 دقيقة",
        xpReward: 120,
        sortOrder: 1,
        isFreePreview: true,
        bunnyVideoId: null,
        starterCode:
          "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
        solutionNotes: "التعقيد الزمني للبحث الثنائي O(log n) بشرط ترتيب المصفوفة.",
        isUnlocked: true,
        isCompleted: false,
      },
      {
        id: 202,
        courseId: 2,
        slug: "stack-and-queue",
        titleAr: "المكدس Stack والطابور Queue في الذاكرة",
        lessonType: "video",
        durationSeconds: 1560,
        durationLabelAr: "26 دقيقة",
        xpReward: 140,
        sortOrder: 2,
        isFreePreview: false,
        bunnyVideoId: null,
        starterCode: "stack = []\nstack.append(10)\nstack.append(20)\nprint(stack.pop())",
        solutionNotes: "Stack يعمل بنظام LIFO بينما Queue يعمل بنظام FIFO.",
        isUnlocked: false,
        isCompleted: false,
      },
      {
        id: 203,
        courseId: 2,
        slug: "sorting-big-o",
        titleAr: "خوارزميات الترتيب وتحليل التعقيد Big-O",
        lessonType: "video",
        durationSeconds: 1680,
        durationLabelAr: "28 دقيقة",
        xpReward: 160,
        sortOrder: 3,
        isFreePreview: false,
        bunnyVideoId: null,
        starterCode: "nums = [42, 7, 19, 3]\nprint(sorted(nums))",
        solutionNotes: "الترتيب الفقاعي O(n^2) بينما Merge Sort يحقق O(n log n).",
        isUnlocked: false,
        isCompleted: false,
      },
    ],
  },
  {
    id: 3,
    slug: "grade11-sql-databases",
    titleAr: "قواعد البيانات و SQL العملية — تانية ثانوي",
    descriptionAr:
      "تصميم الجداول، المفاتيح الأساسية والأجنبية، وكتابة استعلامات SQL الاحترافية للامتحان.",
    grade: "grade_11",
    track: "databases",
    priceEgp: 240,
    isFree: false,
    isEntitled: false,
    lessons: [
      {
        id: 301,
        courseId: 3,
        slug: "relational-schema-keys",
        titleAr: "الجداول والمفاتيح الأساسية Primary & Foreign Keys",
        lessonType: "video",
        durationSeconds: 1200,
        durationLabelAr: "20 دقيقة",
        xpReward: 110,
        sortOrder: 1,
        isFreePreview: true,
        bunnyVideoId: null,
        starterCode: "SELECT id, full_name, grade FROM users WHERE xp >= 1000;",
        solutionNotes: "المفتاح الأساسي فريد لكل صف ولا يقبل NULL.",
        isUnlocked: true,
        isCompleted: false,
      },
      {
        id: 302,
        courseId: 3,
        slug: "joins-aggregations",
        titleAr: "الربط JOIN والتجميع GROUP BY في SQL",
        lessonType: "video",
        durationSeconds: 1380,
        durationLabelAr: "23 دقيقة",
        xpReward: 135,
        sortOrder: 2,
        isFreePreview: false,
        bunnyVideoId: null,
        starterCode:
          "SELECT grade, COUNT(*) AS students FROM users GROUP BY grade ORDER BY students DESC;",
        solutionNotes: "استخدم GROUP BY مع دوال التجميع مثل COUNT و SUM.",
        isUnlocked: false,
        isCompleted: false,
      },
    ],
  },
];

const SEEDED_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    slug: "grade11-cs-summary-pdf",
    titleAr: "ملزمة السايبر الشاملة — نظري تانية ثانوي",
    descriptionAr:
      "ملخص مركز بالخرائط الذهنية وأسئلة الامتحانات المتوقعة (تُعرض داخل قارئ المنصة المحمي).",
    productType: "pdf_note",
    grade: "grade_11",
    priceEgp: 85,
    stockCount: null,
    isUnlocked: true,
    pages: [
      {
        pageNumber: 1,
        headingAr: "الفصل الأول: تحليل الخوارزميات والبحث الثنائي",
        paragraphsAr: [
          "البحث الخطي Linear Search يفحص العناصر واحداً تلو الآخر بزمن قدره O(n) في أسوأ حالة، ولا يشترط ترتيب المصفوفة.",
          "البحث الثنائي Binary Search يقسم نطاق البحث إلى نصفين في كل خطوة بزمن قدره O(log n)، بشرط أن تكون المصفوفة مرتبة تصاعدياً أو تنازلياً.",
        ],
        codeSample:
          "mid = (low + high) // 2\nif arr[mid] == target:\n    return mid",
      },
      {
        pageNumber: 2,
        headingAr: "الفصل الثاني: هياكل البيانات Stack و Queue",
        paragraphsAr: [
          "المكدس Stack يتبع قاعدة LIFO (آخر ما يدخل يخرج أولاً)، وأهم عملياته push للإضافة و pop للإزالة من القمة.",
          "الطابور Queue يتبع قاعدة FIFO (أول ما يدخل يخرج أولاً) ويُستخدم في جدولة المهام وطلبات الطباعة.",
        ],
        codeSample:
          "from collections import deque\nqueue = deque(['Task1', 'Task2'])\nprint(queue.popleft())",
      },
      {
        pageNumber: 3,
        headingAr: "بنك نقاط الامتحان السريعة",
        paragraphsAr: [
          "تذكر دائماً: التعقيد الثابت O(1) يعني أن الزمن لا يعتمد على حجم المدخلات n مثل الوصول لعنصر في مصفوفة بالفهرس arr[i].",
          "تأكد من تحديث low = mid + 1 و high = mid - 1 داخل حلقة البحث الثنائي لتجنب التكرار اللانهائي.",
        ],
        codeSample: null,
      },
    ],
  },
  {
    id: 2,
    slug: "grade10-python-master-pdf",
    titleAr: "ملزمة بايثون وخرائط التدفق — أولى ثانوي (PDF محمي)",
    descriptionAr:
      "ملخص عملي شامل للرموز والخوارزميات والشروط والحلقات مع نماذج إجابة استرشادية.",
    productType: "pdf_note",
    grade: "grade_10",
    priceEgp: 75,
    stockCount: null,
    isUnlocked: false,
    pages: [
      {
        pageNumber: 1,
        headingAr: "رموز خرائط التدفق Flowcharts",
        paragraphsAr: [
          "الشكل البيضاوي للبداية والنهاية (Start / End)، ومتوازي الأضلاع للإدخال والإخراج (Input / Output).",
          "المستطيل للعمليات الحسابية والمعالجة، والمعين لاتخاذ القرار المنطقي (نعم / لا).",
        ],
        codeSample: "total = 0\nfor i in range(1, 11):\n    total += i",
      },
      {
        pageNumber: 2,
        headingAr: "الفروق المهمة في أنواع البيانات في Python",
        paragraphsAr: [
          "القسمة العادية `/` تُرجع دائماً float مثل `10 / 2 == 5.0`، بينما `//` تُرجع القسمة الصحيحة `5`.",
          "المعامل `%` يعطي باقي القسمة ويُستخدم في فحص الأرقام الزوجية والفردية.",
        ],
        codeSample: "print(10 / 2, 10 // 2, 10 % 3)",
      },
    ],
  },
  {
    id: 3,
    slug: "grade10-algo-printed-book",
    titleAr: "كتاب CodeVerse المطبوع — أسس البرمجة والخوارزميات",
    descriptionAr:
      "نسخة ورقية فاخرة مطبوعة بالألوان + كود تفعيل هدية للتحديات يصلك للمنزل في جميع المحافظات.",
    productType: "printed_book",
    grade: "grade_10",
    priceEgp: 220,
    stockCount: 120,
    isUnlocked: false,
  },
  {
    id: 4,
    slug: "grade11-final-revision-book",
    titleAr: "كتاب المراجعة النهائية المطبوع — تانية ثانوي",
    descriptionAr:
      "يحتوي على 250 مسألة برمجية محلولة خطوة بخطوة مع شروحات قواعد البيانات والاختبارات السابقة.",
    productType: "printed_book",
    grade: "grade_11",
    priceEgp: 185,
    stockCount: 75,
    isUnlocked: false,
  },
];

const SEEDED_PACKAGES: StorePackage[] = [
  {
    id: 1,
    slug: "single-lesson-pass",
    tier: "single_lesson",
    titleAr: "باقة الحصة الواحدة (Single Lesson)",
    badgeAr: "مرونة سريعة",
    descriptionAr:
      "تذكرة تفعيل لحصة واحدة مركزة أو ملزمة رقمية لدرس محدد قبل الامتحان.",
    grade: "all",
    priceEgp: 45,
    originalPriceEgp: 60,
    discountPercent: 25,
    featuresAr: [
      "تفعيل فوري لدرس أو ملزمة رقمية",
      "تشغيل كامل في ملعب الكود التفاعلي",
      "مناسبة للمراجعة السريعة ليلة الامتحان",
    ],
    includedCourseIds: [1],
    includedProductIds: [1],
  },
  {
    id: 2,
    slug: "monthly-pro-bundle",
    tier: "monthly_bundle",
    titleAr: "الباقة الشهرية المتكاملة (Monthly Bundle)",
    badgeAr: "الأكثر طلباً",
    descriptionAr:
      "تفتح كورس الخوارزميات وهياكل البيانات كاملاً + ملزمة السايبر الشاملة PDF طوال الشهر.",
    grade: "grade_11",
    priceEgp: 240,
    originalPriceEgp: 375,
    discountPercent: 36,
    featuresAr: [
      "فتح كورس الخوارزميات وهياكل البيانات بالكامل",
      "فتح ملزمة السايبر الشاملة داخل القارئ المحمي",
      "دخول أولوية للامتحانات الأسبوعية وتحديات الساحة",
    ],
    includedCourseIds: [2],
    includedProductIds: [1],
  },
  {
    id: 3,
    slug: "full-term-ultimate-bundle",
    tier: "full_term_bundle",
    titleAr: "باقة الترم الكامل الشاملة (Full Term Bundle)",
    badgeAr: "أكبر توفير 30%",
    descriptionAr:
      "وصول شامل لجميع كورسات الترم الأول والثاني + كل الملازم الرقمية المحمية.",
    grade: "all",
    priceEgp: 690,
    originalPriceEgp: 990,
    discountPercent: 30,
    featuresAr: [
      "فتح جميع الكورسات والحصص المشفرة بدون قيود",
      "فتح جميع الملازم الرقمية في القارئ المحمي",
      "جاهزة للتفعيل الفوري بأكواد السناتر أو إنستاباي",
    ],
    includedCourseIds: [1, 2, 3],
    includedProductIds: [1, 2],
  },
];

const SEEDED_VOUCHERS: VoucherRecord[] = [
  {
    id: 1,
    code: "CODEVERSE20",
    discountType: "percent",
    discountValue: 20,
    appliesTo: "all",
    targetId: null,
    targetLabelAr: "خصم 20% على المتجر والكتب",
    maxUses: 250,
    currentUses: 18,
    expiresAt: null,
    isActive: true,
    channelNoteAr: "حملة إطلاق المنصة",
    createdAt: "2026-11-18T10:00:00.000Z",
  },
  {
    id: 2,
    code: "CODE-TERM-2026",
    discountType: "full_unlock",
    discountValue: 0,
    appliesTo: "package",
    targetId: 3,
    targetLabelAr: "باقة الترم الكامل الشاملة (Full Term Bundle)",
    maxUses: 50,
    currentUses: 4,
    expiresAt: null,
    isActive: true,
    channelNoteAr: "تفعيل إنستاباي / سنتر الدقي",
    createdAt: "2026-11-19T12:00:00.000Z",
  },
  {
    id: 3,
    code: "CODE-ALGO-1100",
    discountType: "full_unlock",
    discountValue: 0,
    appliesTo: "course",
    targetId: 2,
    targetLabelAr: "الخوارزميات وهياكل البيانات — تانية ثانوي",
    maxUses: 25,
    currentUses: 2,
    expiresAt: null,
    isActive: true,
    channelNoteAr: "فودافون كاش",
    createdAt: "2026-11-20T09:00:00.000Z",
  },
];

const SEEDED_ORDERS: OrderRecord[] = [
  {
    id: 1,
    orderCode: "ORD-1041",
    userId: "student-demo-a",
    status: "pending",
    paymentMethod: "cod",
    paymentReference: null,
    subtotalEgp: 220,
    discountEgp: 0,
    totalEgp: 220,
    voucherCode: null,
    shippingName: "أحمد محمود علي",
    shippingPhone: "01023456789",
    shippingGovernorate: "القاهرة",
    shippingAddress: "14 شارع مصطفى النحاس، مدينة نصر",
    itemsSummaryAr: "كتاب CodeVerse المطبوع — أسس البرمجة والخوارزميات (×1)",
    createdAt: "2026-11-21T14:20:00.000Z",
  },
  {
    id: 2,
    orderCode: "ORD-1042",
    userId: "student-demo-b",
    status: "shipped",
    paymentMethod: "fawry",
    paymentReference: "991001042",
    subtotalEgp: 185,
    discountEgp: 37,
    totalEgp: 148,
    voucherCode: "CODEVERSE20",
    shippingName: "سلمى خالد حسن",
    shippingPhone: "01198765432",
    shippingGovernorate: "الإسكندرية",
    shippingAddress: "22 شارع فوزي معاذ، سموحة",
    itemsSummaryAr: "كتاب المراجعة النهائية المطبوع — تانية ثانوي (×1)",
    createdAt: "2026-11-21T18:45:00.000Z",
  },
];

interface DemoPhase4Store {
  vouchers: VoucherRecord[];
  orders: OrderRecord[];
  entitledCoursesByUser: Record<string, number[]>;
  entitledProductsByUser: Record<string, number[]>;
  redeemedVouchersByUser: Record<string, string[]>;
  nextVoucherId: number;
  nextOrderId: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __codeversePhase4DemoStore: DemoPhase4Store | undefined;
}

function assertDemoModeAllowed(): void {
  if (!isDemoModeEnabled()) {
    throw new Error("الوضع التجريبي معطّل في بيئة الإنتاج.");
  }
}

function getDemoStore(): DemoPhase4Store {
  if (!globalThis.__codeversePhase4DemoStore) {
    globalThis.__codeversePhase4DemoStore = {
      vouchers: SEEDED_VOUCHERS.map((v) => ({ ...v })),
      orders: SEEDED_ORDERS.map((o) => ({ ...o })),
      entitledCoursesByUser: {},
      entitledProductsByUser: {},
      redeemedVouchersByUser: {},
      nextVoucherId: 100,
      nextOrderId: 1050,
    };
  }
  return globalThis.__codeversePhase4DemoStore;
}

function resolveTargetLabel(
  appliesTo: VoucherAppliesTo,
  targetId: number | null,
): string {
  if (appliesTo === "all") return "جميع الكورسات والباقات والملازم";
  if (appliesTo === "course") {
    return (
      SEEDED_COURSES.find((c) => c.id === targetId)?.titleAr ??
      `كورس #${targetId ?? ""}`
    );
  }
  if (appliesTo === "product") {
    return (
      SEEDED_PRODUCTS.find((p) => p.id === targetId)?.titleAr ??
      `منتج #${targetId ?? ""}`
    );
  }
  return (
    SEEDED_PACKAGES.find((pkg) => pkg.id === targetId)?.titleAr ??
    `باقة #${targetId ?? ""}`
  );
}

async function getUserEntitlementSets(session: UserSession): Promise<{
  courseIds: Set<number>;
  productIds: Set<number>;
}> {
  if (session.mode === "supabase") {
    const courseIds = new Set<number>();
    const productIds = new Set<number>();
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("user_entitlements")
      .select("item_type, course_id, product_id, expires_at")
      .eq("user_id", session.userId);

    if (data) {
      const nowMs = Date.now();
      for (const row of data) {
        if (row.expires_at && Date.parse(String(row.expires_at)) <= nowMs) {
          continue;
        }
        if (row.item_type === "course" && row.course_id) {
          courseIds.add(Number(row.course_id));
        }
        if (row.item_type === "product" && row.product_id) {
          productIds.add(Number(row.product_id));
        }
      }
    }
    return { courseIds, productIds };
  }

  assertDemoModeAllowed();
  const courseIds = new Set<number>([1]);
  const productIds = new Set<number>([1]);
  const store = getDemoStore();
  for (const cid of store.entitledCoursesByUser[session.userId] ?? []) {
    courseIds.add(cid);
  }
  for (const pid of store.entitledProductsByUser[session.userId] ?? []) {
    productIds.add(pid);
  }
  return { courseIds, productIds };
}

function hydrateCourseForUser(
  course: CourseDetail,
  entitledCourseIds: Set<number>,
  isAdmin: boolean,
): CourseDetail {
  const isEntitled = isAdmin || course.isFree || entitledCourseIds.has(course.id);
  const lessons: CourseLessonItem[] = course.lessons.map((lesson) => ({
    ...lesson,
    isUnlocked: isEntitled || lesson.isFreePreview,
  }));
  return {
    ...course,
    isEntitled,
    lessons,
  };
}

export async function getCoursesCatalog(
  session: UserSession,
): Promise<CoursesBootstrapData> {
  const { courseIds } = await getUserEntitlementSets(session);
  const isAdmin = session.role === "admin";
  return {
    mode: session.mode,
    studentName: session.fullName,
    studentPhone: session.phone ?? "01019482735",
    courses: SEEDED_COURSES.map((course) =>
      hydrateCourseForUser(course, courseIds, isAdmin),
    ),
  };
}

export async function getCourseDetailByIdOrSlug(
  session: UserSession,
  idOrSlug: string,
): Promise<CourseDetail | null> {
  const numericId = Number(idOrSlug);
  const target = SEEDED_COURSES.find(
    (c) => c.slug === idOrSlug || (Number.isInteger(numericId) && c.id === numericId),
  );
  if (!target) return null;

  const { courseIds } = await getUserEntitlementSets(session);
  return hydrateCourseForUser(target, courseIds, session.role === "admin");
}

export async function getStoreBootstrapData(
  session: UserSession,
): Promise<StoreBootstrapData> {
  const { courseIds, productIds } = await getUserEntitlementSets(session);
  const isAdmin = session.role === "admin";

  const products: StoreProduct[] = SEEDED_PRODUCTS.map((product) => ({
    ...product,
    isUnlocked:
      product.productType === "pdf_note"
        ? isAdmin || productIds.has(product.id)
        : false,
  }));

  let recentOrders: OrderRecord[] = [];
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.userId)
      .order("id", { ascending: false })
      .limit(10);

    if (data) {
      recentOrders = data.map((row) => ({
        id: Number(row.id),
        orderCode: row.payment_reference || `ORD-${row.id}`,
        userId: String(row.user_id),
        status: row.status as OrderStatus,
        paymentMethod: row.payment_method as PaymentMethod,
        paymentReference: row.payment_reference,
        subtotalEgp: Number(row.subtotal_egp),
        discountEgp: Number(row.discount_egp),
        totalEgp: Number(row.total_egp),
        voucherCode: null,
        shippingName: row.shipping_name,
        shippingPhone: row.shipping_phone,
        shippingGovernorate: row.shipping_governorate,
        shippingAddress: row.shipping_address,
        itemsSummaryAr: "طلب من متجر CodeVerse",
        createdAt: String(row.created_at),
      }));
    }
  } else {
    recentOrders = getDemoStore()
      .orders.filter((o) => o.userId === session.userId)
      .sort((a, b) => b.id - a.id);
  }

  return {
    mode: session.mode,
    studentName: session.fullName,
    studentPhone: session.phone ?? "01019482735",
    studentEmail: session.email,
    products,
    packages: SEEDED_PACKAGES,
    courses: SEEDED_COURSES.map((c) => ({
      id: c.id,
      titleAr: c.titleAr,
      priceEgp: c.priceEgp,
      isEntitled: isAdmin || c.isFree || courseIds.has(c.id),
    })),
    recentOrders,
    paymobConfigured: isPaymobConfigured(),
    fawryConfigured: isFawryConfigured(),
  };
}

export async function getAdminCommerceData(
  session: UserSession,
): Promise<AdminCommerceBootstrapData> {
  const targets = {
    courses: SEEDED_COURSES.map((c) => ({ id: c.id, titleAr: c.titleAr })),
    products: SEEDED_PRODUCTS.map((p) => ({ id: p.id, titleAr: p.titleAr })),
    packages: SEEDED_PACKAGES.map((pkg) => ({ id: pkg.id, titleAr: pkg.titleAr })),
  };

  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const [{ data: vRows }, { data: oRows }] = await Promise.all([
      supabase.from("vouchers").select("*").order("id", { ascending: false }),
      supabase.from("orders").select("*").order("id", { ascending: false }),
    ]);

    const vouchers: VoucherRecord[] = (vRows ?? []).map((v) => ({
      id: Number(v.id),
      code: String(v.code),
      discountType: v.discount_type as VoucherDiscountType,
      discountValue: Number(v.discount_value),
      appliesTo: v.applies_to as VoucherAppliesTo,
      targetId: v.target_id ? Number(v.target_id) : null,
      targetLabelAr: resolveTargetLabel(
        v.applies_to as VoucherAppliesTo,
        v.target_id ? Number(v.target_id) : null,
      ),
      maxUses: Number(v.max_uses),
      currentUses: Number(v.current_uses),
      expiresAt: v.expires_at ? String(v.expires_at) : null,
      isActive: Boolean(v.is_active),
      channelNoteAr: "قاعدة بيانات Supabase",
      createdAt: String(v.created_at),
    }));

    const orders: OrderRecord[] = (oRows ?? []).map((row) => ({
      id: Number(row.id),
      orderCode: row.payment_reference || `ORD-${row.id}`,
      userId: String(row.user_id),
      status: row.status as OrderStatus,
      paymentMethod: row.payment_method as PaymentMethod,
      paymentReference: row.payment_reference,
      subtotalEgp: Number(row.subtotal_egp),
      discountEgp: Number(row.discount_egp),
      totalEgp: Number(row.total_egp),
      voucherCode: null,
      shippingName: row.shipping_name,
      shippingPhone: row.shipping_phone,
      shippingGovernorate: row.shipping_governorate,
      shippingAddress: row.shipping_address,
      itemsSummaryAr: "طلب كتاب مطبوع",
      createdAt: String(row.created_at),
    }));

    return {
      vouchers,
      orders,
      targets,
    };
  }

  assertDemoModeAllowed();
  const demo = getDemoStore();
  return {
    vouchers: [...demo.vouchers].sort((a, b) => b.id - a.id),
    orders: [...demo.orders].sort((a, b) => b.id - a.id),
    targets,
  };
}

export async function generateAdminVoucherBatch(
  session: UserSession,
  input: {
    batchCount: number;
    prefix?: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    appliesTo: VoucherAppliesTo;
    targetId: number | null;
    maxUses: number;
    expiresAt: string | null;
    channelNoteAr: string;
  },
): Promise<VoucherRecord[]> {
  const codes = generateBatchVoucherCodes(input.batchCount, input.prefix ?? "CODE");
  const targetLabelAr = resolveTargetLabel(input.appliesTo, input.targetId);

  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const payload = codes.map((code) => ({
      code,
      discount_type: input.discountType,
      discount_value: input.discountType === "full_unlock" ? 0 : input.discountValue,
      applies_to: input.appliesTo,
      target_id: input.appliesTo === "all" ? null : input.targetId,
      max_uses: input.maxUses,
      expires_at: input.expiresAt,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from("vouchers")
      .insert(payload)
      .select("*");

    if (error || !data) {
      throw new Error(`تعذر حفظ الأكواد في قاعدة البيانات: ${error?.message ?? ""}`);
    }

    return data.map((v) => ({
      id: Number(v.id),
      code: String(v.code),
      discountType: v.discount_type as VoucherDiscountType,
      discountValue: Number(v.discount_value),
      appliesTo: v.applies_to as VoucherAppliesTo,
      targetId: v.target_id ? Number(v.target_id) : null,
      targetLabelAr,
      maxUses: Number(v.max_uses),
      currentUses: Number(v.current_uses),
      expiresAt: v.expires_at ? String(v.expires_at) : null,
      isActive: Boolean(v.is_active),
      channelNoteAr: input.channelNoteAr,
      createdAt: String(v.created_at),
    }));
  }

  assertDemoModeAllowed();
  const demo = getDemoStore();
  const created: VoucherRecord[] = codes.map((code) => {
    const record: VoucherRecord = {
      id: demo.nextVoucherId++,
      code,
      discountType: input.discountType,
      discountValue: input.discountType === "full_unlock" ? 0 : input.discountValue,
      appliesTo: input.appliesTo,
      targetId: input.appliesTo === "all" ? null : input.targetId,
      targetLabelAr,
      maxUses: input.maxUses,
      currentUses: 0,
      expiresAt: input.expiresAt,
      isActive: true,
      channelNoteAr: input.channelNoteAr || "إنستاباي / فودافون كاش / سنتر",
      createdAt: new Date().toISOString(),
    };
    demo.vouchers.unshift(record);
    return record;
  });

  return created;
}

export async function toggleVoucherActive(
  session: UserSession,
  voucherId: number,
  isActive: boolean,
): Promise<VoucherRecord | null> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("vouchers")
      .update({ is_active: isActive })
      .eq("id", voucherId)
      .select("*")
      .maybeSingle();

    if (!data) return null;
    return {
      id: Number(data.id),
      code: String(data.code),
      discountType: data.discount_type as VoucherDiscountType,
      discountValue: Number(data.discount_value),
      appliesTo: data.applies_to as VoucherAppliesTo,
      targetId: data.target_id ? Number(data.target_id) : null,
      targetLabelAr: resolveTargetLabel(
        data.applies_to as VoucherAppliesTo,
        data.target_id ? Number(data.target_id) : null,
      ),
      maxUses: Number(data.max_uses),
      currentUses: Number(data.current_uses),
      expiresAt: data.expires_at ? String(data.expires_at) : null,
      isActive: Boolean(data.is_active),
      channelNoteAr: "محدث",
      createdAt: String(data.created_at),
    };
  }

  assertDemoModeAllowed();
  const found = getDemoStore().vouchers.find((v) => v.id === voucherId);
  if (!found) return null;
  found.isActive = isActive;
  return { ...found };
}

export interface RedeemResult {
  code: string;
  discountType: VoucherDiscountType;
  targetLabelAr: string;
  unlockedCourseIds: number[];
  unlockedProductIds: number[];
  messageAr: string;
}

function collectUnlockedTargetsForVoucher(
  appliesTo: VoucherAppliesTo,
  targetId: number | null,
): { courseIds: number[]; productIds: number[] } {
  if (appliesTo === "course" && targetId) {
    return { courseIds: [targetId], productIds: [] };
  }
  if (appliesTo === "product" && targetId) {
    return { courseIds: [], productIds: [targetId] };
  }
  if (appliesTo === "package" && targetId) {
    const pkg = SEEDED_PACKAGES.find((p) => p.id === targetId);
    if (pkg) {
      return {
        courseIds: [...pkg.includedCourseIds],
        productIds: [...pkg.includedProductIds],
      };
    }
  }
  return {
    courseIds: SEEDED_COURSES.map((c) => c.id),
    productIds: SEEDED_PRODUCTS.filter((p) => p.productType === "pdf_note").map(
      (p) => p.id,
    ),
  };
}

export async function redeemVoucherCode(
  session: UserSession,
  rawCode: string,
): Promise<RedeemResult> {
  const code = normalizeVoucherCode(rawCode);
  if (!code) {
    throw new Error("اكتب كود التفعيل أولاً.");
  }
  if (isBlockedTestVoucherCode(code)) {
    throw new Error("كود التفعيل غير صحيح أو غير نشط.");
  }

  if (session.mode === "supabase") {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("مفتاح خدمة قاعدة البيانات غير متاح لتفعيل الأكواد.");
    }

    const { data: voucher } = await admin
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!voucher || !voucher.is_active) {
      throw new Error("كود التفعيل غير صحيح أو غير نشط.");
    }
    if (voucher.expires_at && Date.parse(String(voucher.expires_at)) <= Date.now()) {
      throw new Error("انتهت صلاحية هذا الكود.");
    }
    if (Number(voucher.current_uses) >= Number(voucher.max_uses)) {
      throw new Error("تم استنفاد الحد الأقصى لاستخدام هذا الكود.");
    }

    const { data: existingRedemption } = await admin
      .from("voucher_redemptions")
      .select("id")
      .eq("voucher_id", voucher.id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (existingRedemption) {
      throw new Error("لقد استخدمت هذا الكود بالفعل على حسابك.");
    }

    const discountType = voucher.discount_type as VoucherDiscountType;
    const appliesTo = voucher.applies_to as VoucherAppliesTo;
    const targetId = voucher.target_id ? Number(voucher.target_id) : null;
    const targetLabelAr = resolveTargetLabel(appliesTo, targetId);

    const unlocked =
      discountType === "full_unlock"
        ? collectUnlockedTargetsForVoucher(appliesTo, targetId)
        : { courseIds: [], productIds: [] };

    if (discountType === "full_unlock") {
      const entitlementRows = [
        ...unlocked.courseIds.map((courseId) => ({
          user_id: session.userId,
          item_type: "course",
          course_id: courseId,
          product_id: null,
          source: appliesTo === "package" ? "package" : "voucher",
          voucher_id: voucher.id,
        })),
        ...unlocked.productIds.map((productId) => ({
          user_id: session.userId,
          item_type: "product",
          course_id: null,
          product_id: productId,
          source: appliesTo === "package" ? "package" : "voucher",
          voucher_id: voucher.id,
        })),
      ];
      if (entitlementRows.length > 0) {
        await admin.from("user_entitlements").upsert(entitlementRows);
      }
    }

    await admin.from("voucher_redemptions").insert({
      voucher_id: voucher.id,
      user_id: session.userId,
    });
    await admin
      .from("vouchers")
      .update({ current_uses: Number(voucher.current_uses) + 1 })
      .eq("id", voucher.id);

    return {
      code,
      discountType,
      targetLabelAr,
      unlockedCourseIds: unlocked.courseIds,
      unlockedProductIds: unlocked.productIds,
      messageAr:
        discountType === "full_unlock"
          ? `تم تفعيل "${targetLabelAr}" بنجاح على حسابك!`
          : `الكود صالح ويمنحك خصم ${voucher.discount_value}${discountType === "percent" ? "%" : " جنيه"} عند الشراء.`,
    };
  }

  assertDemoModeAllowed();
  const demo = getDemoStore();
  const voucher = demo.vouchers.find((v) => v.code === code);
  if (!voucher || !voucher.isActive) {
    throw new Error("كود التفعيل غير صحيح أو غير نشط.");
  }
  if (voucher.expiresAt && Date.parse(voucher.expiresAt) <= Date.now()) {
    throw new Error("انتهت صلاحية هذا الكود.");
  }
  if (voucher.currentUses >= voucher.maxUses) {
    throw new Error("تم استنفاد الحد الأقصى لاستخدام هذا الكود.");
  }

  const userRedeemed = demo.redeemedVouchersByUser[session.userId] ?? [];
  if (userRedeemed.includes(code)) {
    throw new Error("لقد استخدمت هذا الكود بالفعل على حسابك.");
  }

  const unlocked =
    voucher.discountType === "full_unlock"
      ? collectUnlockedTargetsForVoucher(voucher.appliesTo, voucher.targetId)
      : { courseIds: [], productIds: [] };

  if (voucher.discountType === "full_unlock") {
    const existingCourses = new Set(
      demo.entitledCoursesByUser[session.userId] ?? [],
    );
    const existingProducts = new Set(
      demo.entitledProductsByUser[session.userId] ?? [],
    );
    for (const cid of unlocked.courseIds) existingCourses.add(cid);
    for (const pid of unlocked.productIds) existingProducts.add(pid);
    demo.entitledCoursesByUser[session.userId] = Array.from(existingCourses);
    demo.entitledProductsByUser[session.userId] = Array.from(existingProducts);
  }

  demo.redeemedVouchersByUser[session.userId] = [...userRedeemed, code];
  voucher.currentUses += 1;

  return {
    code,
    discountType: voucher.discountType,
    targetLabelAr: voucher.targetLabelAr,
    unlockedCourseIds: unlocked.courseIds,
    unlockedProductIds: unlocked.productIds,
    messageAr:
      voucher.discountType === "full_unlock"
        ? `تم تفعيل "${voucher.targetLabelAr}" بنجاح وفتح المحتوى فوراً!`
        : `الكود صالح ويمنحك خصم ${voucher.discountValue}${voucher.discountType === "percent" ? "%" : " جنيه"} — يمكنك استخدامه في طلبات الكتب.`,
  };
}

export async function createPrintedBookOrder(
  session: UserSession,
  input: {
    productId: number;
    quantity: number;
    shippingName: string;
    shippingPhone: string;
    shippingGovernorate: string;
    shippingAddress: string;
    paymentMethod: PaymentMethod;
    voucherCode?: string;
  },
): Promise<OrderRecord> {
  const product = SEEDED_PRODUCTS.find(
    (p) => p.id === input.productId && p.productType === "printed_book",
  );
  if (!product) {
    throw new Error("الكتاب المطبوع غير متاح في المتجر.");
  }

  const quantity = Math.min(10, Math.max(1, Math.round(input.quantity)));
  const subtotalEgp = Number((product.priceEgp * quantity).toFixed(2));
  let discountEgp = 0;
  let totalEgp = subtotalEgp;
  let appliedVoucherId: number | null = null;
  let appliedVoucherCode: string | null = null;

  const cleanVoucherCode =
    input.voucherCode && input.voucherCode.trim()
      ? normalizeVoucherCode(input.voucherCode)
      : null;

  if (cleanVoucherCode && isBlockedTestVoucherCode(cleanVoucherCode)) {
    throw new Error("كود الخصم المدخل غير صحيح أو غير نشط.");
  }

  if (session.mode === "supabase") {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("مفتاح خدمة قاعدة البيانات غير مهيأ لتسجيل الطلبات.");
    }

    if (cleanVoucherCode) {
      const { data: voucher } = await admin
        .from("vouchers")
        .select("*")
        .eq("code", cleanVoucherCode)
        .maybeSingle();

      if (!voucher || !voucher.is_active) {
        throw new Error("كود الخصم المدخل غير صحيح أو غير نشط.");
      }
      if (voucher.expires_at && Date.parse(String(voucher.expires_at)) <= Date.now()) {
        throw new Error("انتهت صلاحية كود الخصم.");
      }
      if (Number(voucher.current_uses) >= Number(voucher.max_uses)) {
        throw new Error("تم استنفاد الحد الأقصى لاستخدام هذا الكود.");
      }

      const appliesTo = String(voucher.applies_to);
      if (
        appliesTo !== "all" &&
        !(appliesTo === "product" && Number(voucher.target_id) === product.id)
      ) {
        throw new Error("كود الخصم لا ينطبق على هذا الكتاب المطبوع.");
      }

      const { data: existingRedemption } = await admin
        .from("voucher_redemptions")
        .select("id")
        .eq("voucher_id", voucher.id)
        .eq("user_id", session.userId)
        .maybeSingle();

      if (existingRedemption) {
        throw new Error("لقد استخدمت هذا الكود بالفعل على حسابك.");
      }

      const calc = calculateVoucherDiscount(subtotalEgp, {
        discountType: voucher.discount_type as VoucherDiscountType,
        discountValue: Number(voucher.discount_value),
      });
      discountEgp = calc.discountEgp;
      totalEgp = calc.totalEgp;
      appliedVoucherId = Number(voucher.id);
      appliedVoucherCode = cleanVoucherCode;
    }

    const orderSuffix = `${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    const orderCode = `ORD-${orderSuffix}`;
    const paymentReference =
      input.paymentMethod === "fawry"
        ? `991${orderSuffix.slice(0, 6)}`
        : input.paymentMethod === "paymob"
          ? `PM-${orderCode}`
          : orderCode;

    const { data, error } = await admin
      .from("orders")
      .insert({
        user_id: session.userId,
        status: totalEgp === 0 ? "paid" : "pending",
        payment_method: input.paymentMethod,
        payment_reference: paymentReference,
        subtotal_egp: subtotalEgp,
        discount_egp: discountEgp,
        total_egp: totalEgp,
        voucher_id: appliedVoucherId,
        shipping_name: input.shippingName,
        shipping_phone: input.shippingPhone,
        shipping_governorate: input.shippingGovernorate,
        shipping_address: input.shippingAddress,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`تعذر حفظ طلب الشحن: ${error?.message ?? ""}`);
    }

    await admin.from("order_items").insert({
      order_id: data.id,
      item_type: "product",
      product_id: product.id,
      unit_price_egp: product.priceEgp,
      quantity,
    });

    if (appliedVoucherId) {
      await admin.from("voucher_redemptions").insert({
        voucher_id: appliedVoucherId,
        user_id: session.userId,
        order_id: data.id,
      });

      const { data: latestVoucher } = await admin
        .from("vouchers")
        .select("current_uses")
        .eq("id", appliedVoucherId)
        .maybeSingle();

      if (latestVoucher) {
        await admin
          .from("vouchers")
          .update({ current_uses: Number(latestVoucher.current_uses) + 1 })
          .eq("id", appliedVoucherId);
      }
    }

    return {
      id: Number(data.id),
      orderCode,
      userId: session.userId,
      status: data.status as OrderStatus,
      paymentMethod: input.paymentMethod,
      paymentReference,
      subtotalEgp,
      discountEgp,
      totalEgp,
      voucherCode: appliedVoucherCode,
      shippingName: input.shippingName,
      shippingPhone: input.shippingPhone,
      shippingGovernorate: input.shippingGovernorate,
      shippingAddress: input.shippingAddress,
      itemsSummaryAr: `${product.titleAr} (×${quantity})`,
      createdAt: String(data.created_at),
    };
  }

  assertDemoModeAllowed();
  const demo = getDemoStore();
  if (cleanVoucherCode) {
    const voucher = demo.vouchers.find((v) => v.code === cleanVoucherCode && v.isActive);
    if (!voucher) {
      throw new Error("كود الخصم المدخل غير صحيح أو غير نشط.");
    }
    const calc = calculateVoucherDiscount(subtotalEgp, voucher);
    discountEgp = calc.discountEgp;
    totalEgp = calc.totalEgp;
    appliedVoucherId = voucher.id;
    appliedVoucherCode = cleanVoucherCode;
  }

  const nextNum = demo.nextOrderId++;
  const orderCode = `ORD-${nextNum}`;
  const paymentReference =
    input.paymentMethod === "fawry"
      ? `991${String(nextNum).padStart(6, "0")}`
      : input.paymentMethod === "paymob"
        ? `PM-${orderCode}`
        : orderCode;

  const record: OrderRecord = {
    id: nextNum,
    orderCode,
    userId: session.userId,
    status: totalEgp === 0 ? "paid" : "pending",
    paymentMethod: input.paymentMethod,
    paymentReference,
    subtotalEgp,
    discountEgp,
    totalEgp,
    voucherCode: appliedVoucherCode,
    shippingName: input.shippingName,
    shippingPhone: input.shippingPhone,
    shippingGovernorate: input.shippingGovernorate,
    shippingAddress: input.shippingAddress,
    itemsSummaryAr: `${product.titleAr} (×${quantity})`,
    createdAt: new Date().toISOString(),
  };

  demo.orders.unshift(record);
  return record;
}

export async function updateAdminOrderStatus(
  session: UserSession,
  orderId: number,
  status: OrderStatus,
): Promise<OrderRecord | null> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*")
      .maybeSingle();

    if (!data) {
      return null;
    }

    return {
      id: Number(data.id),
      orderCode: data.payment_reference || `ORD-${data.id}`,
      userId: String(data.user_id),
      status: data.status as OrderStatus,
      paymentMethod: data.payment_method as PaymentMethod,
      paymentReference: data.payment_reference,
      subtotalEgp: Number(data.subtotal_egp),
      discountEgp: Number(data.discount_egp),
      totalEgp: Number(data.total_egp),
      voucherCode: null,
      shippingName: data.shipping_name,
      shippingPhone: data.shipping_phone,
      shippingGovernorate: data.shipping_governorate,
      shippingAddress: data.shipping_address,
      itemsSummaryAr: "طلب من المتجر",
      createdAt: String(data.created_at),
    };
  }

  assertDemoModeAllowed();
  const found = getDemoStore().orders.find((o) => o.id === orderId);
  if (!found) return null;
  found.status = status;
  return { ...found };
}

export async function markOrderPaidByReference(
  paymentReference: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data } = await admin
      .from("orders")
      .update({ status: "paid" })
      .eq("payment_reference", paymentReference)
      .select("id");
    return Boolean(data && data.length > 0);
  }

  if (!isDemoModeEnabled()) {
    return false;
  }

  const found = getDemoStore().orders.find(
    (o) =>
      o.paymentReference === paymentReference || o.orderCode === paymentReference,
  );
  if (!found) return false;
  found.status = "paid";
  return true;
}

export function lookupCheckoutItem(
  itemType: "package" | "course" | "product",
  targetId: number,
): { titleAr: string; priceEgp: number } | null {
  if (itemType === "package") {
    const pkg = SEEDED_PACKAGES.find((p) => p.id === targetId);
    return pkg ? { titleAr: pkg.titleAr, priceEgp: pkg.priceEgp } : null;
  }
  if (itemType === "course") {
    const c = SEEDED_COURSES.find((item) => item.id === targetId);
    return c ? { titleAr: c.titleAr, priceEgp: c.priceEgp } : null;
  }
  const prod = SEEDED_PRODUCTS.find((item) => item.id === targetId);
  return prod ? { titleAr: prod.titleAr, priceEgp: prod.priceEgp } : null;
}

export function revalidatePhase4Paths(): void {
  try {
    revalidatePath("/courses");
    revalidatePath("/store");
    revalidatePath("/admin");
    revalidatePath("/admin/vouchers");
  } catch {
    // Safe no-op outside Next.js request lifecycle (e.g. unit tests)
  }
}
