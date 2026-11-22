import type {
  AiGenerationResult,
  GeneratedQuestionDraft,
  QuestionLanguage,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

function detectLanguageFromText(text: string): QuestionLanguage {
  if (/console\.log|let\s+|const\s+/i.test(text)) return "javascript";
  if (/#include|cout\s*<</i.test(text)) return "cpp";
  if (/\bSELECT\b.*\bFROM\b/i.test(text)) return "sql";
  return "python";
}

function extractSentences(text: string): string[] {
  return text
    .split(/[\n.!؟]+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 16);
}

export function generateDemoGroundedDrafts(params: {
  curriculumText: string;
  sourceName: string;
  grade: GradeTier | "all";
  topic: string;
  mcqCount: number;
  factOrCapCount: number;
  outputRushCount: number;
}): AiGenerationResult {
  const sentences = extractSentences(params.curriculumText);
  const lang = detectLanguageFromText(params.curriculumText);
  const firstFact =
    sentences[0] ||
    `يركّز درس ${params.topic} على تنظيم المنطق البرمجي وتجنب الأخطاء الشائعة في التنفيذ.`;
  const secondFact =
    sentences[1] ||
    `استخدام المتغيرات والشروط بوضوح في ${params.topic} يقلل الأخطاء المنطقية.`;

  const codeLine =
    params.curriculumText
      .split(/\r?\n/)
      .find((line) => /=|for\s+|if\s+|print|console\.log|cout/.test(line))
      ?.trim() || "x = 4\nfor i in range(1, 4):\n    x += i\nprint(x)";

  const questions: GeneratedQuestionDraft[] = [];

  for (let i = 0; i < params.mcqCount; i += 1) {
    const anchor = sentences[i % Math.max(1, sentences.length)] ?? firstFact;
    questions.push({
      draftId: `demo-mcq-${i + 1}`,
      grade: params.grade,
      topic: params.topic,
      questionType: "mcq",
      promptAr:
        i === 0
          ? `بناءً على النص المرفق في (${params.topic})، أي العبارات التالية تصف المفهوم بدقة؟`
          : `سؤال اختيار من متعدد (${i + 1}) حول ${params.topic} استناداً إلى ${params.sourceName}:`,
      codeSnippet: null,
      language: lang,
      options: [
        anchor.slice(0, 110),
        "تجاهل شروط التوقف داخل الحلقات التكرارية لتسريع المعالج",
        "تخزين البيانات الدائمة داخل RAM بعد إغلاق الجهاز",
        "كتابة الكود بدون تحديد أنواع أو تهيئة المتغيرات الأولية",
      ],
      correctAnswer: anchor.slice(0, 110),
      explanationAr: `مستخرج مباشرة من المرجع (${params.sourceName}): ${anchor}`,
      difficulty: i === 0 ? "easy" : "medium",
      sourcePdfName: params.sourceName,
    });
  }

  for (let i = 0; i < params.factOrCapCount; i += 1) {
    const isFact = i % 2 === 0;
    const factAnchor =
      sentences[(i + 1) % Math.max(1, sentences.length)] ?? secondFact;
    questions.push({
      draftId: `demo-foc-${i + 1}`,
      grade: params.grade,
      topic: params.topic,
      questionType: "fact_or_cap",
      promptAr: isFact
        ? `حقيقة أم هبد (${params.topic}): ${factAnchor}`
        : `حقيقة أم هبد (${params.topic}): وفقاً للدرس، لا يؤثر ترتيب الخطوات أو الشروط على الناتج النهائي للخوارزمية.`,
      codeSnippet: null,
      language: lang,
      options: ["حقيقة", "هبد"],
      correctAnswer: isFact ? "حقيقة" : "هبد",
      explanationAr: isFact
        ? `العبارة صحيحة وتطابق ما ورد في ${params.sourceName}.`
        : `العبارة غير صحيحة (هبد)؛ فترتيب التعليمات وفحص الشروط أساسي في ${params.topic}.`,
      difficulty: "easy",
      sourcePdfName: params.sourceName,
    });
  }

  for (let i = 0; i < params.outputRushCount; i += 1) {
    const snippet =
      i === 0 && codeLine.includes("\n")
        ? codeLine
        : lang === "javascript"
          ? "let sum = 2;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum);"
          : lang === "cpp"
            ? "int sum = 2;\nfor (int i = 1; i <= 3; i++) {\n    sum += i;\n}\ncout << sum;"
            : "sum_val = 2\nfor i in range(1, 4):\n    sum_val += i\nprint(sum_val)";

    questions.push({
      draftId: `demo-out-${i + 1}`,
      grade: params.grade,
      topic: params.topic,
      questionType: "output_rush",
      promptAr: `توقّع المخرج النهائي لهذا المثال التطبيقي في (${params.topic}):`,
      codeSnippet: snippet,
      language: lang,
      options: ["8", "6", "10", "5"],
      correctAnswer: "8",
      explanationAr:
        "تبدأ القيمة بـ 2 ثم يضاف إليها 1 ثم 2 ثم 3 (2 + 1 + 2 + 3 = 8).",
      difficulty: "medium",
      sourcePdfName: params.sourceName,
    });
  }

  return {
    provider: "demo",
    modelUsed: "demo-grounded-extractor",
    sourceName: params.sourceName,
    questions,
    cheatSheet: {
      titleAr: `ورقة المراجعة السريعة: ${params.topic}`,
      summaryAr: `ملخص مركز مستخرج من "${params.sourceName}" لتثبيت المفاهيم الأساسية قبل الاختبار.`,
      keyTerms: [
        {
          term: params.topic,
          definitionAr: firstFact,
        },
        {
          term: "التحقق من المنطق",
          definitionAr: secondFact,
        },
      ],
      sections: [
        {
          headingAr: "أهم النقاط المستخرجة من المنهج",
          bulletsAr: sentences.length > 0 ? sentences.slice(0, 4) : [firstFact, secondFact],
          codeExample: codeLine,
        },
      ],
    },
  };
}
