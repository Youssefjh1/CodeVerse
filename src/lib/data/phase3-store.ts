import { revalidatePath } from "next/cache";
import { createMockDashboardData } from "@/lib/data/mock-dashboard";
import { getRankProgress } from "@/lib/gamification/ranks";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { selectRandomQuestionsForExam } from "@/lib/arena/scoring";
import type {
  ArenaBootstrapData,
  BankQuestion,
  ExamCadence,
  LeaderboardEntry,
  QuestionDifficulty,
  QuestionLanguage,
  QuestionType,
  ScheduledExam,
} from "@/types/arena";
import type { GradeTier, UserSession } from "@/types/gamification";

const SEEDED_QUESTIONS: BankQuestion[] = [
  // Fact or Cap (8 rapid-fire CS theory statements)
  {
    id: 101,
    grade: "grade_10",
    topic: "أساسيات بايثون",
    questionType: "fact_or_cap",
    promptAr: "في Python، ناتج القسمة العادية `10 / 2` يكون من نوع عدد عشري `float` وليس `int`.",
    codeSnippet: "print(type(10 / 2))",
    language: "python",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "علامة `/` تعيد دائماً عدداً عشرياً `5.0` من نوع `float`، بينما القسمة الصحيحة `//` تعيد `int`.",
    difficulty: "easy",
    sourcePdfName: "منهج أولى ثانوي — الوحدة الأولى",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:00:00.000Z",
  },
  {
    id: 102,
    grade: "grade_10",
    topic: "تمثيل البيانات والذاكرة",
    questionType: "fact_or_cap",
    promptAr: "ذاكرة الـ ROM تفقد جميع بياناتها بمجرد فصل الكهرباء عن الكمبيوتر.",
    codeSnippet: null,
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "هبد",
    explanationAr: "ذاكرة ROM غير متطايرة وتحتفظ ببرنامج الإقلاع حتى عند فصل الكهرباء، أما RAM فهي المتطايرة.",
    difficulty: "easy",
    sourcePdfName: "منهج أولى ثانوي — مكونات الحاسب",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:05:00.000Z",
  },
  {
    id: 103,
    grade: "grade_10",
    topic: "النظام الثنائي",
    questionType: "fact_or_cap",
    promptAr: "الرقم الثنائي `1010` يساوي الرقم العشري `10`.",
    codeSnippet: "(1010)_2 = 8 + 0 + 2 + 0",
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "بقيم الأوزان الثنائية (8, 4, 2, 1): `1*8 + 0*4 + 1*2 + 0*1 = 10`.",
    difficulty: "easy",
    sourcePdfName: "تمثيل البيانات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:10:00.000Z",
  },
  {
    id: 104,
    grade: "grade_11",
    topic: "تحليل الخوارزميات",
    questionType: "fact_or_cap",
    promptAr: "خوارزمية البحث الثنائي Binary Search تعمل بكفاءة حتى لو لم تكن المصفوفة مرتبة.",
    codeSnippet: null,
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "هبد",
    explanationAr: "شرط أساسي للبحث الثنائي `O(log n)` أن تكون العناصر مرتبة مسبقاً تصاعدياً أو تنازلياً.",
    difficulty: "medium",
    sourcePdfName: "خوارزميات تانية ثانوي",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:15:00.000Z",
  },
  {
    id: 105,
    grade: "grade_11",
    topic: "هياكل البيانات",
    questionType: "fact_or_cap",
    promptAr: "المكدس Stack يتبع قاعدة LIFO أي أن آخر عنصر يدخل هو أول عنصر يخرج.",
    codeSnippet: "stack.push(10) -> stack.push(20) -> stack.pop() == 20",
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "Stack يعني Last-In First-Out (LIFO)، على عكس Queue الذي يتبع FIFO.",
    difficulty: "easy",
    sourcePdfName: "هياكل البيانات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:20:00.000Z",
  },
  {
    id: 106,
    grade: "all",
    topic: "المترجمات والمفسرات",
    questionType: "fact_or_cap",
    promptAr: "المترجم Compiler يترجم البرنامج بالكامل لملف تنفيذي قبل التشغيل، بينما المفسر Interpreter ينفذ سطراً بسطر.",
    codeSnippet: null,
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "تستخدم C++ مترجماً (Compiler) يحول الكود للغة الآلة دفعة واحدة، بينما تعتمد Python غالباً على المفسر.",
    difficulty: "easy",
    sourcePdfName: "مفاهيم لغات البرمجة",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:25:00.000Z",
  },
  {
    id: 107,
    grade: "grade_11",
    topic: "قواعد البيانات",
    questionType: "fact_or_cap",
    promptAr: "يمكن تكرار قيمة المفتاح الأساسي Primary Key في أكثر من صف داخل نفس الجدول.",
    codeSnippet: "CREATE TABLE users (id BIGINT PRIMARY KEY);",
    language: "sql",
    options: ["حقيقة", "هبد"],
    correctAnswer: "هبد",
    explanationAr: "المفتاح الأساسي Primary Key يجب أن يكون فريداً (Unique) ولا يقبل قيماً فارغة NULL.",
    difficulty: "medium",
    sourcePdfName: "أساسيات SQL",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:30:00.000Z",
  },
  {
    id: 108,
    grade: "all",
    topic: "الشبكات والأمن السيبراني",
    questionType: "fact_or_cap",
    promptAr: "بروتوكول HTTPS يستخدم التشفير لحماية البيانات المتبادلة بين المتصفح والخادم.",
    codeSnippet: null,
    language: "pseudocode",
    options: ["حقيقة", "هبد"],
    correctAnswer: "حقيقة",
    explanationAr: "حرف S يرمز لـ Secure عبر شهادة TLS/SSL لتشفير الاتصال ومنع التنصت.",
    difficulty: "easy",
    sourcePdfName: "أمن الشبكات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T10:35:00.000Z",
  },

  // Output Rush (6 timed code output challenges)
  {
    id: 201,
    grade: "grade_10",
    topic: "الحلقات في بايثون",
    questionType: "output_rush",
    promptAr: "ما الناتج المطبوع عند تشغيل كود Python التالي؟",
    codeSnippet: "total = 0\nfor i in range(1, 5):\n    if i % 2 == 0:\n        total += i\nprint(total)",
    language: "python",
    options: ["6", "10", "4", "2"],
    correctAnswer: "6",
    explanationAr: "الدالة `range(1, 5)` تعطي `1, 2, 3, 4`. الأرقام الزوجية فقط هي `2` و`4` ومجموعهما `6`.",
    difficulty: "easy",
    sourcePdfName: "حلقات Python",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:00:00.000Z",
  },
  {
    id: 202,
    grade: "grade_11",
    topic: "تقطيع النصوص والقوائم",
    questionType: "output_rush",
    promptAr: "توقّع المخرج النهائي للقائمة التالية:",
    codeSnippet: "arr = [5, 10, 15, 20, 25]\nprint(arr[1:4])",
    language: "python",
    options: ["[10, 15, 20]", "[5, 10, 15]", "[10, 15, 20, 25]", "[15, 20]"],
    correctAnswer: "[10, 15, 20]",
    explanationAr: "التقطيع `arr[1:4]` يبدأ من الفهرس `1` (`10`) ويتوقف قبل الفهرس `4` (`25`).",
    difficulty: "medium",
    sourcePdfName: "هياكل البيانات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:05:00.000Z",
  },
  {
    id: 203,
    grade: "grade_10",
    topic: "أولويات العمليات",
    questionType: "output_rush",
    promptAr: "ما القيمة التي ستظهر في شاشة المخرجات؟",
    codeSnippet: "let x = 3;\nlet y = x++ + 5;\nconsole.log(x, y);",
    language: "javascript",
    options: ["4 8", "4 9", "3 8", "3 9"],
    correctAnswer: "4 8",
    explanationAr: "المعامل البعدي `x++` يستخدم قيمة `x` الحالية (`3`) في الجمع ليصبح `y = 8`، ثم تزيد `x` إلى `4`.",
    difficulty: "medium",
    sourcePdfName: "أساسيات JavaScript",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:10:00.000Z",
  },
  {
    id: 204,
    grade: "grade_11",
    topic: "القسمة الصحيحة في C++",
    questionType: "output_rush",
    promptAr: "ما الناتج المطبوع في لغة C++؟",
    codeSnippet: "int a = 9, b = 4;\ncout << (a / b) << \"-\" << (a % b);",
    language: "cpp",
    options: ["2-1", "2.25-1", "2-2", "1-2"],
    correctAnswer: "2-1",
    explanationAr: "قسمة عددين صحيحين في C++ تعطي الجزء الصحيح `2`، وباقي القسمة `9 % 4` هو `1`.",
    difficulty: "medium",
    sourcePdfName: "أساسيات C++",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:15:00.000Z",
  },
  {
    id: 205,
    grade: "grade_11",
    topic: "الدوال والاستدعاء الذاتي",
    questionType: "output_rush",
    promptAr: "ماذا تطبع دالة الاستدعاء الذاتي التالية؟",
    codeSnippet: "def mystery(n):\n    if n <= 1:\n        return 1\n    return n * mystery(n - 1)\n\nprint(mystery(4))",
    language: "python",
    options: ["24", "10", "16", "12"],
    correctAnswer: "24",
    explanationAr: "الدالة تحسب المضروب `4! = 4 × 3 × 2 × 1 = 24`.",
    difficulty: "hard",
    sourcePdfName: "الاستدعاء الذاتي Recursion",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:20:00.000Z",
  },
  {
    id: 206,
    grade: "all",
    topic: "الشروط المتداخلة",
    questionType: "output_rush",
    promptAr: "ما النص المطبوع من هذا الشرط؟",
    codeSnippet: "score = 82\nif score >= 90:\n    print('A')\nelif score >= 80:\n    print('B')\nelse:\n    print('C')",
    language: "python",
    options: ["B", "A", "C", "A B"],
    correctAnswer: "B",
    explanationAr: "الشرط الأول `82 >= 90` خاطئ، ثم يتحقق الشرط الثاني `82 >= 80` فيطبع `B` ويخرج.",
    difficulty: "easy",
    sourcePdfName: "تراكيب التفرع",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T11:25:00.000Z",
  },

  // Debug Duel (6 bug-fixing challenges)
  {
    id: 301,
    grade: "grade_10",
    topic: "أخطاء حدود المصفوفة",
    questionType: "debug_duel",
    promptAr: "الكود يهدف لطباعة كل عناصر القائمة ولكنه يُسقط العنصر الأخير. ما التعديل الصحيح؟",
    codeSnippet: "items = [10, 20, 30, 40]\nfor i in range(len(items) - 1):\n    print(items[i])",
    language: "python",
    options: [
      "استبدال range(len(items) - 1) بـ range(len(items))",
      "استبدال print(items[i]) بـ print(items[i + 2])",
      "تغيير القائمة إلى tuple",
      "وضع break داخل الحلقة",
    ],
    correctAnswer: "استبدال range(len(items) - 1) بـ range(len(items))",
    explanationAr: "الدالة `range(len(items))` تولد الفهارس `0, 1, 2, 3` كاملة، بينما `- 1` تتوقف عند الفهرس `2`.",
    difficulty: "easy",
    sourcePdfName: "مبارزات تصحيح الأخطاء",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:00:00.000Z",
  },
  {
    id: 302,
    grade: "grade_10",
    topic: "خطأ المقارنة والتعيين",
    questionType: "debug_duel",
    promptAr: "الكود يغيّر قيمة `x` إلى `10` بدلاً من فحصها في الشرط! أين الخطأ؟",
    codeSnippet: "let x = 4;\nif (x = 10) {\n  console.log('Matched');\n}",
    language: "javascript",
    options: [
      "استخدام `===` بدلاً من `=` داخل جملة if",
      "تغيير `let` إلى `var`",
      "حذف الأقواس حول الشرط",
      "إضافة `;` بعد `if`",
    ],
    correctAnswer: "استخدام `===` بدلاً من `=` داخل جملة if",
    explanationAr: "علامة `=` للتعيين بينما `===` أو `==` للمقارنة المنطقية.",
    difficulty: "easy",
    sourcePdfName: "تصحيح أخطاء JS",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:05:00.000Z",
  },
  {
    id: 303,
    grade: "grade_11",
    topic: "البحث الثنائي",
    questionType: "debug_duel",
    promptAr: "في دالة البحث الثنائي التالية، ما السطر الناقص لمنع حلقة لا نهائية؟",
    codeSnippet: "while low <= high:\n    mid = (low + high) // 2\n    if arr[mid] == target:\n        return mid\n    elif arr[mid] < target:\n        low = mid\n    else:\n        high = mid - 1",
    language: "python",
    options: [
      "تغيير low = mid إلى low = mid + 1",
      "تغيير while low <= high إلى while low == high",
      "تغيير mid = (low + high) // 2 إلى mid = low * high",
      "حذف return mid",
    ],
    correctAnswer: "تغيير low = mid إلى low = mid + 1",
    explanationAr: "بما أننا فحصنا `arr[mid]` بالفعل، يجب تحريك `low` إلى `mid + 1` لتقليص نطاق البحث ومنع التكرار اللانهائي.",
    difficulty: "hard",
    sourcePdfName: "الخوارزميات تانية ثانوي",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:10:00.000Z",
  },
  {
    id: 304,
    grade: "grade_11",
    topic: "الحلقات اللانهائية",
    questionType: "debug_duel",
    promptAr: "حلقة while في C++ لا تتوقف أبداً عن طباعة 5. كيف نصلحها؟",
    codeSnippet: "int count = 5;\nwhile (count > 0) {\n    cout << count << endl;\n}",
    language: "cpp",
    options: [
      "إضافة count--; داخل جسم الحلقة",
      "تغيير while (count > 0) إلى while (count >= 0)",
      "تغيير int count = 5 إلى float count = 5",
      "إضافة cout << 0 في النهاية",
    ],
    correctAnswer: "إضافة count--; داخل جسم الحلقة",
    explanationAr: "عدم تحديث متغير الشرط `count` داخل الحلقة يبقي الشرط `5 > 0` صحيحاً للأبد.",
    difficulty: "easy",
    sourcePdfName: "حلقات C++",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:15:00.000Z",
  },
  {
    id: 305,
    grade: "all",
    topic: "حساب المتوسط الحسابي",
    questionType: "debug_duel",
    promptAr: "الدالة تعيد نتيجة خاطئة للمتوسط الحسابي بسبب أولوية العمليات. ما الإصلاح الصحيح؟",
    codeSnippet: "def average(a, b, c):\n    return a + b + c / 3",
    language: "python",
    options: [
      "إضافة أقواس: return (a + b + c) / 3",
      "تغيير `/ 3` إلى `* 3`",
      "تبديل `a + b` إلى `a - b`",
      "إزالة `return` واستخدام `pass`",
    ],
    correctAnswer: "إضافة أقواس: return (a + b + c) / 3",
    explanationAr: "القسمة تُنفذ قبل الجمع، لذلك `a + b + c / 3` تقسم `c` فقط على `3` ما لم نضع الأقواس.",
    difficulty: "medium",
    sourcePdfName: "الأولويات الحسابية",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:20:00.000Z",
  },
  {
    id: 306,
    grade: "grade_11",
    topic: "تهيئة المراكم",
    questionType: "debug_duel",
    promptAr: "دالة حساب المضروب تعيد دائماً `0` مهما كان المدخل! ما سبب الخطأ؟",
    codeSnippet: "let product = 0;\nfor (let i = 1; i <= 5; i++) {\n  product *= i;\n}",
    language: "javascript",
    options: [
      "تهيئة product بالقيمة 1 بدلاً من 0",
      "بدء الحلقة من i = 0",
      "تغيير <= إلى <",
      "تغيير *= إلى +=",
    ],
    correctAnswer: "تهيئة product بالقيمة 1 بدلاً من 0",
    explanationAr: "العنصر المحايد للضرب هو `1`؛ البدء بـ `0` يجعل ناتج أي عملية ضرب صفراً دائماً.",
    difficulty: "medium",
    sourcePdfName: "حلقات التراكم",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T12:25:00.000Z",
  },

  // Standard MCQs for Scheduled Exams & 1v1 Flash Blitz (6 questions)
  {
    id: 401,
    grade: "grade_10",
    topic: "تمثيل البيانات",
    questionType: "mcq",
    promptAr: "ما عدد الـ Bits الموجودة في 2 Byte؟",
    codeSnippet: null,
    language: "pseudocode",
    options: ["8 بت", "16 بت", "32 بت", "4 بت"],
    correctAnswer: "16 بت",
    explanationAr: "كل 1 Byte يساوي 8 Bits، وبالتالي 2 Byte = 16 Bit.",
    difficulty: "easy",
    sourcePdfName: "الوحدة الأولى — أولى ثانوي",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:00:00.000Z",
  },
  {
    id: 402,
    grade: "grade_10",
    topic: "خرائط التدفق Flowcharts",
    questionType: "mcq",
    promptAr: "أي شكل هندسي يُستخدم لتمثيل اتخاذ القرار (الشرط) في خرائط التدفق؟",
    codeSnippet: null,
    language: "pseudocode",
    options: ["المعين (Diamond)", "المستطيل", "متوازي الأضلاع", "الشكل البيضاوي"],
    correctAnswer: "المعين (Diamond)",
    explanationAr: "الشكل المعين يمثل سؤالاً منطقياً يخرج منه فرعان (نعم / لا).",
    difficulty: "easy",
    sourcePdfName: "خرائط التدفق",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:05:00.000Z",
  },
  {
    id: 403,
    grade: "grade_11",
    topic: "التعقيد الزمني Big-O",
    questionType: "mcq",
    promptAr: "ما التعقيد الزمني لأسوأ حالة في خوارزمية البحث الخطي Linear Search؟",
    codeSnippet: null,
    language: "pseudocode",
    options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
    correctAnswer: "O(n)",
    explanationAr: "في أسوأ حالة يفحص البحث الخطي جميع العناصر الـ n بالترتيب.",
    difficulty: "medium",
    sourcePdfName: "تحليل الخوارزميات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:10:00.000Z",
  },
  {
    id: 404,
    grade: "grade_11",
    topic: "هياكل البيانات",
    questionType: "mcq",
    promptAr: "أي بنية بيانات مناسبة لترتيب طلبات الطباعة حسب أسبقية الوصول (FIFO)؟",
    codeSnippet: null,
    language: "pseudocode",
    options: ["الطابور Queue", "المكدس Stack", "الشجرة الثنائية", "المصفوفة غير المرتبة"],
    correctAnswer: "الطابور Queue",
    explanationAr: "الطابور Queue يطبق مبدأ First-In First-Out (FIFO) لخدمة الطلبات بترتيب وصولها.",
    difficulty: "easy",
    sourcePdfName: "هياكل البيانات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:15:00.000Z",
  },
  {
    id: 405,
    grade: "all",
    topic: "البوابات المنطقية",
    questionType: "mcq",
    promptAr: "في بوابة AND المنطقية، متى يكون الخرج يساوي 1 (True)؟",
    codeSnippet: "A AND B == 1",
    language: "pseudocode",
    options: [
      "عندما يكون كل من A و B يساوي 1",
      "عندما يكون أحد المدخلين فقط يساوي 1",
      "عندما يكون كل من A و B يساوي 0",
      "دائماً يساوي 1",
    ],
    correctAnswer: "عندما يكون كل من A و B يساوي 1",
    explanationAr: "بوابة AND تعطي 1 فقط إذا تحقق الشرطان معاً.",
    difficulty: "easy",
    sourcePdfName: "البوابات المنطقية",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:20:00.000Z",
  },
  {
    id: 406,
    grade: "all",
    topic: "أساسيات SQL",
    questionType: "mcq",
    promptAr: "أي أمر SQL يُستخدم لفرز نتائج الاستعلام تصاعدياً أو تنازلياً؟",
    codeSnippet: "SELECT full_name, xp FROM users ...;",
    language: "sql",
    options: ["ORDER BY", "GROUP BY", "WHERE", "INSERT INTO"],
    correctAnswer: "ORDER BY",
    explanationAr: "جملة `ORDER BY` ترتب الصفوف حسب العمود المطلوب مع `ASC` أو `DESC`.",
    difficulty: "medium",
    sourcePdfName: "قواعد البيانات",
    aiGenerated: false,
    isApproved: true,
    createdAt: "2026-11-18T13:25:00.000Z",
  },
];

const SEEDED_EXAMS: ScheduledExam[] = [
  {
    id: 1,
    titleAr: "اختبار الأسبوع — الخوارزميات والمنطق (تانية ثانوي)",
    grade: "grade_11",
    examCadence: "weekly",
    questionIds: [104, 105, 202, 303, 403, 404],
    questionCount: 6,
    durationMinutes: 10,
    xpReward: 250,
    coinsReward: 75,
    startsAt: "2026-11-20T08:00:00.000Z",
    endsAt: "2026-11-28T23:59:00.000Z",
    isPublished: true,
    createdAt: "2026-11-20T08:00:00.000Z",
  },
  {
    id: 2,
    titleAr: "امتحان الشهر — أساسيات Python وتمثيل البيانات (أولى ثانوي)",
    grade: "grade_10",
    examCadence: "monthly",
    questionIds: [101, 102, 103, 201, 301, 401, 402],
    questionCount: 7,
    durationMinutes: 15,
    xpReward: 320,
    coinsReward: 95,
    startsAt: "2026-11-20T08:00:00.000Z",
    endsAt: "2026-11-30T23:59:00.000Z",
    isPublished: true,
    createdAt: "2026-11-20T08:30:00.000Z",
  },
];

const SEEDED_LEADERBOARD_STUDENTS: Array<{
  userId: string;
  fullName: string;
  grade: GradeTier;
  weeklyXp: number;
  seasonXp: number;
  streak: number;
  solvedCount: number;
}> = [
  // Grade 10 (أولى ثانوي)
  {
    userId: "lb-g10-1",
    fullName: "مريم خالد",
    grade: "grade_10",
    weeklyXp: 1120,
    seasonXp: 4680,
    streak: 18,
    solvedCount: 54,
  },
  {
    userId: "lb-g10-2",
    fullName: "زياد عمرو",
    grade: "grade_10",
    weeklyXp: 1290,
    seasonXp: 3920,
    streak: 11,
    solvedCount: 47,
  },
  {
    userId: "lb-g10-3",
    fullName: "حبيبة سامح",
    grade: "grade_10",
    weeklyXp: 940,
    seasonXp: 4150,
    streak: 15,
    solvedCount: 49,
  },
  {
    userId: "lb-g10-4",
    fullName: "عمر شريف",
    grade: "grade_10",
    weeklyXp: 760,
    seasonXp: 2890,
    streak: 9,
    solvedCount: 33,
  },
  {
    userId: "lb-g10-5",
    fullName: "سلمى هشام",
    grade: "grade_10",
    weeklyXp: 640,
    seasonXp: 2410,
    streak: 6,
    solvedCount: 28,
  },

  // Grade 11 (تانية ثانوي)
  {
    userId: "lb-g11-1",
    fullName: "آدم محسن",
    grade: "grade_11",
    weeklyXp: 1480,
    seasonXp: 5340,
    streak: 22,
    solvedCount: 68,
  },
  {
    userId: "lb-g11-2",
    fullName: "نور محمد",
    grade: "grade_11",
    weeklyXp: 1610,
    seasonXp: 4720,
    streak: 19,
    solvedCount: 61,
  },
  {
    userId: "lb-g11-3",
    fullName: "فارس وليد",
    grade: "grade_11",
    weeklyXp: 1190,
    seasonXp: 4950,
    streak: 16,
    solvedCount: 59,
  },
  {
    userId: "lb-g11-4",
    fullName: "ملك تامر",
    grade: "grade_11",
    weeklyXp: 890,
    seasonXp: 3180,
    streak: 10,
    solvedCount: 40,
  },
];

interface DemoPhase3Store {
  questions: BankQuestion[];
  exams: ScheduledExam[];
  nextQuestionId: number;
  nextExamId: number;
  examAttempts: Array<{
    examId: number;
    userId: string;
    scorePercent: number;
    xpAwarded: number;
    submittedAt: string;
  }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __codeversePhase3DemoStore: DemoPhase3Store | undefined;
}

function getDemoStore(): DemoPhase3Store {
  if (!globalThis.__codeversePhase3DemoStore) {
    globalThis.__codeversePhase3DemoStore = {
      questions: SEEDED_QUESTIONS.map((q) => ({ ...q, options: [...q.options] })),
      exams: SEEDED_EXAMS.map((e) => ({ ...e, questionIds: [...e.questionIds] })),
      nextQuestionId: 1000,
      nextExamId: 100,
      examAttempts: [],
    };
  }
  return globalThis.__codeversePhase3DemoStore;
}

interface DbQuestionBankRow {
  id: number;
  grade: GradeTier | "all";
  topic: string;
  question_type: QuestionType;
  prompt_ar: string;
  code_snippet: string | null;
  language: QuestionLanguage;
  options_json: string[] | unknown;
  correct_answer: string;
  explanation_ar: string;
  difficulty: QuestionDifficulty;
  source_pdf_name: string | null;
  ai_generated: boolean;
  is_approved: boolean;
  created_at: string;
}

interface DbExamRow {
  id: number;
  title_ar: string;
  grade: GradeTier | "all";
  exam_cadence: ExamCadence;
  question_ids: number[];
  duration_minutes: number;
  xp_reward: number;
  coins_reward: number;
  starts_at: string | null;
  ends_at: string | null;
  is_published: boolean;
  created_at: string;
}

function mapDbQuestionRow(row: DbQuestionBankRow): BankQuestion {
  const options = Array.isArray(row.options_json)
    ? row.options_json.map((item) => String(item))
    : [];
  return {
    id: Number(row.id),
    grade: row.grade,
    topic: row.topic,
    questionType: row.question_type,
    promptAr: row.prompt_ar,
    codeSnippet: row.code_snippet,
    language: row.language,
    options,
    correctAnswer: row.correct_answer,
    explanationAr: row.explanation_ar,
    difficulty: row.difficulty,
    sourcePdfName: row.source_pdf_name,
    aiGenerated: row.ai_generated,
    isApproved: row.is_approved,
    createdAt: row.created_at,
  };
}

function mapDbExamRow(row: DbExamRow): ScheduledExam {
  const questionIds = Array.isArray(row.question_ids)
    ? row.question_ids.map((id) => Number(id))
    : [];
  return {
    id: Number(row.id),
    titleAr: row.title_ar,
    grade: row.grade,
    examCadence: row.exam_cadence,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes: row.duration_minutes,
    xpReward: row.xp_reward,
    coinsReward: row.coins_reward,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}

function buildRankedLeaderboards(
  currentUser: {
    userId: string;
    fullName: string;
    grade: GradeTier;
    xp: number;
    streak: number;
  },
  extraRows: typeof SEEDED_LEADERBOARD_STUDENTS,
  includeDemoSeeds = false,
): ArenaBootstrapData["leaderboardsByGrade"] {
  const merged = includeDemoSeeds ? [...SEEDED_LEADERBOARD_STUDENTS] : [];

  for (const row of extraRows) {
    if (!merged.some((item) => item.userId === row.userId)) {
      merged.push(row);
    }
  }

  const targetGrade: "grade_10" | "grade_11" =
    currentUser.grade === "grade_10" ? "grade_10" : "grade_11";

  const existingSelf = merged.find((item) => item.userId === currentUser.userId);
  if (!existingSelf) {
    merged.push({
      userId: currentUser.userId,
      fullName: currentUser.fullName,
      grade: targetGrade,
      weeklyXp: Math.min(1350, Math.max(480, Math.round(currentUser.xp * 0.28))),
      seasonXp: currentUser.xp,
      streak: currentUser.streak,
      solvedCount: Math.max(12, Math.round(currentUser.xp / 85)),
    });
  }

  const rankByGrade = (grade: "grade_10" | "grade_11") => {
    const gradePool = merged.filter((entry) => entry.grade === grade);

    const toEntry = (
      item: (typeof SEEDED_LEADERBOARD_STUDENTS)[number],
      index: number,
    ): LeaderboardEntry => ({
      rank: index + 1,
      userId: item.userId,
      fullName: item.fullName,
      grade: item.grade,
      rankTitleAr: getRankProgress(item.seasonXp).current.titleAr,
      weeklyXp: item.weeklyXp,
      seasonXp: item.seasonXp,
      streak: item.streak,
      solvedCount: item.solvedCount,
      isCurrentUser: item.userId === currentUser.userId,
    });

    const weekly = [...gradePool]
      .sort((a, b) => b.weeklyXp - a.weeklyXp)
      .map(toEntry);
    const season = [...gradePool]
      .sort((a, b) => b.seasonXp - a.seasonXp)
      .map(toEntry);

    return { weekly, season };
  };

  return {
    grade_10: rankByGrade("grade_10"),
    grade_11: rankByGrade("grade_11"),
  };
}

export async function listAllAdminQuestions(
  session: UserSession,
): Promise<BankQuestion[]> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("questions_bank")
      .select("*")
      .order("id", { ascending: false })
      .returns<DbQuestionBankRow[]>();

    if (error) {
      throw new Error(`تعذر جلب بنك الأسئلة: ${error.message}`);
    }
    return (data ?? []).map(mapDbQuestionRow);
  }

  return [...getDemoStore().questions].sort((a, b) => b.id - a.id);
}

export async function saveApprovedQuestions(
  session: UserSession,
  items: Array<{
    grade: GradeTier | "all";
    topic: string;
    questionType: QuestionType;
    promptAr: string;
    codeSnippet: string | null;
    language: QuestionLanguage;
    options: string[];
    correctAnswer: string;
    explanationAr: string;
    difficulty: QuestionDifficulty;
    sourcePdfName: string | null;
    aiGenerated: boolean;
  }>,
): Promise<BankQuestion[]> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const payload = items.map((item) => ({
      grade: item.grade,
      topic: item.topic,
      question_type: item.questionType,
      prompt_ar: item.promptAr,
      code_snippet: item.codeSnippet,
      language: item.language,
      options_json: item.options,
      correct_answer: item.correctAnswer,
      explanation_ar: item.explanationAr,
      difficulty: item.difficulty,
      source_pdf_name: item.sourcePdfName,
      ai_generated: item.aiGenerated,
      is_approved: true,
      created_by: session.userId,
    }));

    const { data, error } = await supabase
      .from("questions_bank")
      .insert(payload)
      .select("*")
      .returns<DbQuestionBankRow[]>();

    if (error) {
      throw new Error(`فشل حفظ الأسئلة في قاعدة البيانات: ${error.message}`);
    }
    return (data ?? []).map(mapDbQuestionRow);
  }

  const store = getDemoStore();
  const created: BankQuestion[] = items.map((item) => {
    const next: BankQuestion = {
      id: store.nextQuestionId++,
      grade: item.grade,
      topic: item.topic,
      questionType: item.questionType,
      promptAr: item.promptAr,
      codeSnippet: item.codeSnippet,
      language: item.language,
      options: [...item.options],
      correctAnswer: item.correctAnswer,
      explanationAr: item.explanationAr,
      difficulty: item.difficulty,
      sourcePdfName: item.sourcePdfName,
      aiGenerated: item.aiGenerated,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    store.questions.unshift(next);
    return next;
  });

  return created;
}

export async function deleteQuestionById(
  session: UserSession,
  questionId: number,
): Promise<boolean> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("questions_bank")
      .delete()
      .eq("id", questionId);
    return !error;
  }

  const store = getDemoStore();
  const prevLen = store.questions.length;
  store.questions = store.questions.filter((q) => q.id !== questionId);
  return store.questions.length < prevLen;
}

export async function listScheduledExams(
  session: UserSession,
  includeUnpublished: boolean,
): Promise<ScheduledExam[]> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("exams")
      .select("*")
      .order("id", { ascending: false });
    if (!includeUnpublished) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query.returns<DbExamRow[]>();
    if (error) {
      throw new Error(`تعذر جلب الامتحانات: ${error.message}`);
    }
    return (data ?? []).map(mapDbExamRow);
  }

  const store = getDemoStore();
  return store.exams
    .filter((exam) => includeUnpublished || exam.isPublished)
    .sort((a, b) => b.id - a.id);
}

export async function createScheduledExam(
  session: UserSession,
  input: {
    titleAr: string;
    grade: GradeTier | "all";
    examCadence: ExamCadence;
    questionCount: number;
    durationMinutes: number;
    xpReward: number;
    coinsReward: number;
    startsAt: string | null;
    endsAt: string | null;
    isPublished: boolean;
  },
): Promise<ScheduledExam> {
  const allQuestions = await listAllAdminQuestions(session);
  const selected = selectRandomQuestionsForExam(
    allQuestions,
    input.grade,
    input.questionCount,
  );
  if (selected.length === 0) {
    throw new Error("لا توجد أسئلة معتمدة كافية لهذا الصف الدراسي لإنشاء الامتحان.");
  }

  const questionIds = selected.map((q) => q.id);

  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("exams")
      .insert({
        title_ar: input.titleAr,
        grade: input.grade,
        exam_cadence: input.examCadence,
        question_ids: questionIds,
        duration_minutes: input.durationMinutes,
        xp_reward: input.xpReward,
        coins_reward: input.coinsReward,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        is_published: input.isPublished,
        created_by: session.userId,
      })
      .select("*")
      .single<DbExamRow>();

    if (error || !data) {
      throw new Error(`تعذر حفظ الامتحان المجدول: ${error?.message ?? "خطأ غير معروف"}`);
    }
    return mapDbExamRow(data);
  }

  const store = getDemoStore();
  const created: ScheduledExam = {
    id: store.nextExamId++,
    titleAr: input.titleAr,
    grade: input.grade,
    examCadence: input.examCadence,
    questionIds,
    questionCount: questionIds.length,
    durationMinutes: input.durationMinutes,
    xpReward: input.xpReward,
    coinsReward: input.coinsReward,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    isPublished: input.isPublished,
    createdAt: new Date().toISOString(),
  };
  store.exams.unshift(created);
  return created;
}

export async function toggleExamPublished(
  session: UserSession,
  examId: number,
  isPublished: boolean,
): Promise<ScheduledExam | null> {
  if (session.mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("exams")
      .update({ is_published: isPublished })
      .eq("id", examId)
      .select("*")
      .maybeSingle<DbExamRow>();
    if (!error && data) {
      return mapDbExamRow(data);
    }
    return null;
  }

  const store = getDemoStore();
  const found = store.exams.find((e) => e.id === examId);
  if (!found) return null;
  found.isPublished = isPublished;
  return { ...found };
}

export async function getExamWithQuestions(
  session: UserSession,
  examId: number,
): Promise<{ exam: ScheduledExam; questions: BankQuestion[] } | null> {
  if (session.mode === "supabase") {
    const adminClient = createSupabaseAdminClient();
    const client = adminClient ?? (await createSupabaseServerClient());
    const { data: examRow } = await client
      .from("exams")
      .select("*")
      .eq("id", examId)
      .maybeSingle<DbExamRow>();

    if (examRow && (examRow.is_published || session.role === "admin")) {
      const mappedExam = mapDbExamRow(examRow);
      if (mappedExam.questionIds.length === 0) {
        return { exam: mappedExam, questions: [] };
      }
      if (adminClient) {
        const { data: questionRows } = await adminClient
          .from("questions_bank")
          .select("*")
          .in("id", mappedExam.questionIds)
          .returns<DbQuestionBankRow[]>();
        const byId = new Map((questionRows ?? []).map((row) => [Number(row.id), mapDbQuestionRow(row)]));
        const ordered = mappedExam.questionIds
          .map((id) => byId.get(id))
          .filter((q): q is BankQuestion => Boolean(q));
        return { exam: mappedExam, questions: ordered };
      }
    }
    return null;
  }

  const store = getDemoStore();
  const exam = store.exams.find((e) => e.id === examId);
  if (!exam || (!exam.isPublished && session.role !== "admin")) {
    return null;
  }

  const byId = new Map(store.questions.map((q) => [q.id, q]));
  const questions = exam.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is BankQuestion => Boolean(q));

  return { exam, questions };
}

export async function recordExamAttempt(
  session: UserSession,
  params: {
    examId: number;
    answers: Record<string, string>;
    scorePercent: number;
    xpAwarded: number;
  },
): Promise<void> {
  if (session.mode === "supabase") {
    const client = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    await client.from("exam_attempts").insert({
      exam_id: params.examId,
      user_id: session.userId,
      answers_json: params.answers,
      score_percent: params.scorePercent,
      xp_awarded: params.xpAwarded,
      submitted_at: new Date().toISOString(),
    });
    return;
  }

  getDemoStore().examAttempts.push({
    examId: params.examId,
    userId: session.userId,
    scorePercent: params.scorePercent,
    xpAwarded: params.xpAwarded,
    submittedAt: new Date().toISOString(),
  });
}

export async function getArenaBootstrapData(
  session: UserSession,
): Promise<ArenaBootstrapData> {
  let questions: BankQuestion[] = [];
  let exams: ScheduledExam[] = [];
  let currentUserStats = {
    userId: session.userId,
    fullName: session.fullName,
    grade: session.grade,
    xp: 3450,
    streak: 14,
  };
  let extraLeaderboardRows: typeof SEEDED_LEADERBOARD_STUDENTS = [];

  if (session.mode === "demo") {
    const mock = createMockDashboardData({
      userId: session.userId,
      fullName: session.fullName,
      email: session.email,
      grade: session.grade,
      role: session.role,
      avatarFrame: session.avatarFrame,
    });
    currentUserStats = {
      userId: mock.profile.userId,
      fullName: mock.profile.fullName,
      grade: mock.profile.grade,
      xp: mock.profile.xp,
      streak: mock.profile.streak,
    };
    const store = getDemoStore();
    questions = store.questions.filter((q) => q.isApproved);
    exams = store.exams.filter((e) => e.isPublished);
  } else {
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const [{ data: userRow }, { data: examRows }] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, grade, xp, streak")
        .eq("id", session.userId)
        .maybeSingle<{
          id: string;
          full_name: string;
          grade: GradeTier;
          xp: number;
          streak: number;
        }>(),
      supabase
        .from("exams")
        .select("*")
        .eq("is_published", true)
        .order("id", { ascending: false })
        .returns<DbExamRow[]>(),
    ]);

    currentUserStats = {
      userId: session.userId,
      fullName: userRow?.full_name ?? session.fullName,
      grade: userRow?.grade ?? session.grade,
      xp: userRow?.xp ?? 0,
      streak: userRow?.streak ?? 0,
    };

    exams = (examRows ?? []).map(mapDbExamRow);

    if (adminClient) {
      const [{ data: qRows }, { data: lbRows }] = await Promise.all([
        adminClient
          .from("questions_bank")
          .select("*")
          .eq("is_approved", true)
          .order("id", { ascending: false })
          .returns<DbQuestionBankRow[]>(),
        adminClient
          .from("users")
          .select("id, full_name, grade, xp, streak")
          .in("grade", ["grade_10", "grade_11"])
          .order("xp", { ascending: false })
          .limit(20)
          .returns<
            Array<{
              id: string;
              full_name: string;
              grade: GradeTier;
              xp: number;
              streak: number;
            }>
          >(),
      ]);

      if (qRows && qRows.length > 0) {
        questions = qRows.map(mapDbQuestionRow);
      }
      if (lbRows && lbRows.length > 0) {
        extraLeaderboardRows = lbRows.map((row) => ({
          userId: row.id,
          fullName: row.full_name,
          grade: row.grade,
          weeklyXp: Math.min(2000, Math.round(row.xp * 0.3)),
          seasonXp: row.xp,
          streak: row.streak,
          solvedCount: Math.max(1, Math.round(row.xp / 90)),
        }));
      }
    }

    if (isDemoModeEnabled()) {
      if (questions.length === 0) {
        questions = getDemoStore().questions.filter((q) => q.isApproved);
      }
      if (exams.length === 0) {
        exams = getDemoStore().exams.filter((e) => e.isPublished);
      }
    }
  }

  return {
    mode: session.mode,
    currentUser: {
      ...currentUserStats,
      rankTitleAr: getRankProgress(currentUserStats.xp).current.titleAr,
    },
    factOrCapQuestions: questions.filter((q) => q.questionType === "fact_or_cap"),
    outputRushQuestions: questions.filter((q) => q.questionType === "output_rush"),
    debugDuelQuestions: questions.filter((q) => q.questionType === "debug_duel"),
    flashBlitzPool: questions.filter(
      (q) => q.questionType === "mcq" || q.questionType === "output_rush",
    ),
    scheduledExams: exams,
    leaderboardsByGrade: buildRankedLeaderboards(
      currentUserStats,
      extraLeaderboardRows,
      session.mode === "demo",
    ),
    realtimeConfigured: isSupabaseConfigured(),
  };
}

export function revalidateArenaAndAdminPaths(): void {
  try {
    revalidatePath("/arena");
    revalidatePath("/admin");
    revalidatePath("/admin/ai-engine");
  } catch {
    // Safe no-op outside Next.js request lifecycle (e.g. unit tests)
  }
}
