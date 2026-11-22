import type { PlaygroundLanguage, PlaygroundLesson } from "@/types/playground";

export interface LanguageOption {
  id: PlaygroundLanguage;
  label: string;
  fileName: string;
  monacoLanguage: "python" | "javascript" | "cpp";
  badgeText: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    id: "python",
    label: "Python",
    fileName: "main.py",
    monacoLanguage: "python",
    badgeText: "PY",
  },
  {
    id: "javascript",
    label: "JavaScript",
    fileName: "main.js",
    monacoLanguage: "javascript",
    badgeText: "JS",
  },
  {
    id: "cpp",
    label: "C++",
    fileName: "main.cpp",
    monacoLanguage: "cpp",
    badgeText: "C++",
  },
] as const;

export function getLanguageOption(language: PlaygroundLanguage): LanguageOption {
  return (
    LANGUAGE_OPTIONS.find((item) => item.id === language) ?? LANGUAGE_OPTIONS[0]
  );
}

export const PLAYGROUND_LESSONS: readonly PlaygroundLesson[] = [
  {
    id: "loop-1-to-10",
    titleAr: "حلقة طباعة من 1 لـ 10",
    subtitleAr: "تتبع تغيّر العداد i في الذاكرة دورة بدورة أثناء الطباعة.",
    levelLabelAr: "أساسي",
    conceptTagAr: "حلقات التكرار",
    goalAr:
      "لاحظ كيف يتحول العداد i في الذاكرة من 1 إلى 10 خطوة بخطوة، وكيف يطبع كل تكرار سطراً جديداً.",
    codeByLanguage: {
      python: [
        "limit = 10",
        "for i in range(1, limit + 1):",
        "    print(i)",
      ].join("\n"),
      javascript: [
        "let limit = 10;",
        "for (let i = 1; i <= limit; i++) {",
        "  console.log(i);",
        "}",
      ].join("\n"),
      cpp: [
        "#include <iostream>",
        "using namespace std;",
        "",
        "int main() {",
        "    int limit = 10;",
        "    for (int i = 1; i <= limit; i++) {",
        "        cout << i << endl;",
        "    }",
        "    return 0;",
        "}",
      ].join("\n"),
    },
    lineTipsByLanguage: {
      python: {
        1: "نخزن الحد الأقصى للتكرار داخل المتغير limit.",
        2: "دالة range(1, limit + 1) تبدأ من 1 وتنتهي عند 10.",
        3: "تطبع قيمة العداد i في كل دورة داخل شاشة المخرجات.",
      },
      javascript: {
        1: "نعرف المتغير limit بقيمة 10 لتحديد نهاية الحلقة.",
        2: "تبدأ الحلقة بـ i = 1 وتستمر طالما i <= limit مع زيادة i++ كل دورة.",
        3: "console.log تطبع قيمة i الحالية في كل تكرار.",
      },
      cpp: {
        5: "نعرف متغير عدد صحيح limit لتحديد نهاية التكرار.",
        6: "تبدأ الحلقة من i = 1 وتزيد i++ بعد كل دورة حتى تصل إلى 10.",
        7: "cout تطبع قيمة المتغير i ثم تنتقل لسطر جديد.",
      },
    },
  },
  {
    id: "grade-pass-fail",
    titleAr: "فحص الدرجة ناجح/راسب",
    subtitleAr: "اختبار الشروط المتعددة وتحديد التقدير بناءً على الدرجة.",
    levelLabelAr: "أساسي",
    conceptTagAr: "الشروط المنطقية",
    goalAr:
      "تتبع مسار الشرط if / else عند قيمة score = 78، ثم جرّب تغييرها إلى 40 أو 92 وشاهد اختلاف التنفيذ.",
    codeByLanguage: {
      python: [
        "score = 78",
        "pass_mark = 50",
        'status = "قيد الفحص"',
        "",
        "if score >= 85:",
        '    status = "امتياز"',
        "elif score >= pass_mark:",
        '    status = "ناجح"',
        "else:",
        '    status = "راسب"',
        "",
        'print("الدرجة:", score)',
        'print("النتيجة:", status)',
      ].join("\n"),
      javascript: [
        "let score = 78;",
        "const passMark = 50;",
        'let status = "قيد الفحص";',
        "",
        "if (score >= 85) {",
        '  status = "امتياز";',
        "} else if (score >= passMark) {",
        '  status = "ناجح";',
        "} else {",
        '  status = "راسب";',
        "}",
        "",
        'console.log("الدرجة:", score);',
        'console.log("النتيجة:", status);',
      ].join("\n"),
      cpp: [
        "#include <iostream>",
        "#include <string>",
        "using namespace std;",
        "",
        "int main() {",
        "    int score = 78;",
        "    int passMark = 50;",
        '    string status = "قيد الفحص";',
        "",
        "    if (score >= 85) {",
        '        status = "امتياز";',
        "    } else if (score >= passMark) {",
        '        status = "ناجح";',
        "    } else {",
        '        status = "راسب";',
        "    }",
        "",
        '    cout << "الدرجة: " << score << endl;',
        '    cout << "النتيجة: " << status << endl;',
        "    return 0;",
        "}",
      ].join("\n"),
    },
    lineTipsByLanguage: {
      python: {
        1: "جرّب تعديل قيمة score إلى 40 أو 92 لملاحظة تغيّر المسار.",
        5: "نختبر أولاً هل حقق الطالب درجة الامتياز (85 فأكثر)؟",
        7: "إذا لم يكن امتيازاً، نختبر هل الدرجة تحقق حد النجاح (50)؟",
        9: "ينفذ فرع else فقط عندما تفشل جميع الشروط السابقة.",
        13: "نطبع التقدير النهائي المحفوظ في المتغير status.",
      },
      javascript: {
        1: "جرّب تعديل قيمة score إلى 40 أو 92 وشغّل الكود من جديد.",
        5: "يتم فحص شرط الامتياز أولاً: هل score >= 85؟",
        7: "عند فشل الشرط الأول ننتقل لاختبار شرط النجاح.",
        9: "الفرع البديل يعمل تلقائياً إذا كانت الدرجة أقل من 50.",
        14: "تُعرض النتيجة النهائية بعد الخروج من جملة الشرط.",
      },
      cpp: {
        6: "جرّب تعديل score إلى 40 أو 92 لملاحظة تغيّر النتيجة.",
        10: "فحص الشرط الأول: هل الدرجة 85 أو أكثر؟",
        12: "الشرط الثاني يتحقق من وصول الدرجة لحد النجاح.",
        14: "فرع else يعطي تقدير راسب إذا فشلت الشروط السابقة.",
        19: "نطبع النتيجة النهائية المخزنة في المتغير النصي status.",
      },
    },
  },
  {
    id: "sum-even-numbers",
    titleAr: "جمع الأرقام الزوجية",
    subtitleAr: "دمج الحلقات مع باقي القسمة (%) لتجميع الأرقام الزوجية.",
    levelLabelAr: "متوسط",
    conceptTagAr: "حلقات + شروط",
    goalAr:
      "شاهد كيف يلتقط الشرط الأرقام الزوجية فقط (2, 4, 6, 8, 10) ويرفع المجموع total تدريجياً حتى 30.",
    codeByLanguage: {
      python: [
        "total = 0",
        "count = 0",
        "",
        "for n in range(1, 11):",
        "    if n % 2 == 0:",
        "        total = total + n",
        "        count = count + 1",
        '        print("زوجي:", n, "| المجموع:", total)',
        "",
        'print("المجموع النهائي:", total)',
      ].join("\n"),
      javascript: [
        "let total = 0;",
        "let count = 0;",
        "",
        "for (let n = 1; n <= 10; n++) {",
        "  if (n % 2 === 0) {",
        "    total = total + n;",
        "    count = count + 1;",
        '    console.log("زوجي:", n, "| المجموع:", total);',
        "  }",
        "}",
        "",
        'console.log("المجموع النهائي:", total);',
      ].join("\n"),
      cpp: [
        "#include <iostream>",
        "using namespace std;",
        "",
        "int main() {",
        "    int total = 0;",
        "    int count = 0;",
        "",
        "    for (int n = 1; n <= 10; n++) {",
        "        if (n % 2 == 0) {",
        "            total = total + n;",
        "            count = count + 1;",
        '            cout << "زوجي: " << n << " | المجموع: " << total << endl;',
        "        }",
        "    }",
        "",
        '    cout << "المجموع النهائي: " << total << endl;',
        "    return 0;",
        "}",
      ].join("\n"),
    },
    lineTipsByLanguage: {
      python: {
        1: "نجهز المراكم total بقيمة 0 قبل بدء الحلقة.",
        4: "نمر على الأرقام من 1 إلى 10 باستخدام range(1, 11).",
        5: "معامل باقي القسمة (%) يفحص هل الرقم يقبل القسمة على 2 بدون باقٍ.",
        6: "نضيف الرقم الزوجي n إلى القيمة السابقة داخل total.",
        10: "بعد انتهاء الحلقة نطبع المجموع الكلي للأرقام الزوجية.",
      },
      javascript: {
        1: "نبدأ بتهيئة متغير الجمع total بقيمة 0.",
        4: "نمر على كل رقم من 1 إلى 10 داخل الحلقة.",
        5: "باقي القسمة n % 2 === 0 يميز الأرقام الزوجية فقط.",
        6: "يتحدث total لحظياً بإضافة الرقم الزوجي الجديد.",
        12: "تُطبع المحصلة النهائية بعد انتهاء التكرار.",
      },
      cpp: {
        5: "تهيئة المراكم total وعداد الزوجي count بقيمة 0.",
        8: "تتكرر الحلقة من n = 1 حتى n = 10.",
        9: "الشرط n % 2 == 0 يتحقق من أن الرقم زوجي.",
        10: "جمع الرقم الزوجي n على المجموع التراكمي total.",
        16: "طباعة الناتج النهائي بعد انتهاء الحلقة.",
      },
    },
  },
] as const;

export function getLessonById(id: string): PlaygroundLesson {
  return PLAYGROUND_LESSONS.find((lesson) => lesson.id === id) ?? PLAYGROUND_LESSONS[0];
}
