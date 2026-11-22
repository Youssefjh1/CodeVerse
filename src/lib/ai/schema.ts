import type {
  GeneratedCheatSheet,
  GeneratedQuestionDraft,
  QuestionDifficulty,
  QuestionLanguage,
  QuestionType,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

export const STRICT_GROUNDING_SYSTEM_PROMPT = `أنت خبير مناهج علوم الحاسب والبرمجة للمرحلة الثانوية في مصر (منصة CodeVerse).
القواعد الصارمة:
1. التزم التزاماً تاماً بالمادة العلمية الموجودة في ملف PDF أو النص المرفق فقط. لا تضف أي معلومات أو تعريفات أو أسئلة من خارج المصدر المرفق.
2. إذا كانت المادة لا تغطي موضوعاً معيناً، لا تخترعه. صغ جميع الأسئلة وورقة المراجعة (Cheat Sheet) استناداً إلى الحقائق والأمثلة الموجودة داخل المحتوى المرفق فقط.
3. اكتب الأسئلة والشروحات وورقة المراجعة باللغة العربية المصرية الواضحة والمناسبة لطلاب الثانوية، مع الحفاظ على مقاطع الكود والمصطلحات البرمجية باللغة الإنجليزية بدقة.
4. لأسئلة "حقيقة ولا هبد" (fact_or_cap)، اجعل الخيارات بالضبط ["حقيقة", "هبد"] والإجابة الصحيحة إما "حقيقة" أو "هبد".
5. لأسئلة الاختيار من متعدد (mcq) وتوقع المخرج (output_rush)، وفّر 4 خيارات منطقية وغير مكررة وتأكد من تطابق correctAnswer حرفياً مع أحد الخيارات في options.
6. أرجع JSON صالحاً يطابق المخطط (JSON Schema) المحدد بدقة بدون أي نص إضافي خارج JSON.`;

export const AI_EXAM_RESPONSE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionType: {
            type: "string",
            enum: ["mcq", "fact_or_cap", "output_rush"],
          },
          promptAr: { type: "string" },
          codeSnippet: { type: ["string", "null"] },
          language: {
            type: "string",
            enum: ["python", "javascript", "cpp", "pseudocode", "sql"],
          },
          options: {
            type: "array",
            items: { type: "string" },
          },
          correctAnswer: { type: "string" },
          explanationAr: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"],
          },
        },
        required: [
          "questionType",
          "promptAr",
          "codeSnippet",
          "language",
          "options",
          "correctAnswer",
          "explanationAr",
          "difficulty",
        ],
      },
    },
    cheatSheet: {
      type: "object",
      properties: {
        titleAr: { type: "string" },
        summaryAr: { type: "string" },
        keyTerms: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              definitionAr: { type: "string" },
            },
            required: ["term", "definitionAr"],
          },
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headingAr: { type: "string" },
              bulletsAr: {
                type: "array",
                items: { type: "string" },
              },
              codeExample: { type: ["string", "null"] },
            },
            required: ["headingAr", "bulletsAr", "codeExample"],
          },
        },
      },
      required: ["titleAr", "summaryAr", "keyTerms", "sections"],
    },
  },
  required: ["questions", "cheatSheet"],
};

const VALID_TYPES = new Set<QuestionType>([
  "mcq",
  "fact_or_cap",
  "output_rush",
  "debug_duel",
]);

const VALID_LANGUAGES = new Set<QuestionLanguage>([
  "python",
  "javascript",
  "cpp",
  "pseudocode",
  "sql",
]);

const VALID_DIFFICULTIES = new Set<QuestionDifficulty>([
  "easy",
  "medium",
  "hard",
]);

function stripMarkdownJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseAndValidateAiPayload(
  rawText: string,
  ctx: {
    grade: GradeTier | "all";
    topic: string;
    sourceName: string;
  },
): {
  questions: GeneratedQuestionDraft[];
  cheatSheet: GeneratedCheatSheet;
} {
  const cleaned = stripMarkdownJsonFence(rawText);
  if (!cleaned) {
    throw new Error("استجابة النموذج فارغة ولم تحتوي على JSON.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("تعذر تحليل مخرجات الذكاء الاصطناعي كـ JSON منظم صالح.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("هيكل JSON المستلم غير صالح.");
  }

  const record = parsed as Record<string, unknown>;
  const rawQuestions = Array.isArray(record.questions) ? record.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error("لم يتم توليد أي أسئلة من المحتوى المرفق.");
  }

  const questions: GeneratedQuestionDraft[] = rawQuestions.map((item, idx) => {
    const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawType = String(q.questionType ?? "mcq") as QuestionType;
    const questionType: QuestionType = VALID_TYPES.has(rawType) ? rawType : "mcq";

    const promptAr = String(q.promptAr ?? "").trim();
    if (!promptAr) {
      throw new Error(`السؤال رقم ${idx + 1} يفتقد نص السؤال.`);
    }

    const rawLang = String(q.language ?? "python") as QuestionLanguage;
    const language: QuestionLanguage = VALID_LANGUAGES.has(rawLang)
      ? rawLang
      : "python";

    const rawDiff = String(q.difficulty ?? "medium") as QuestionDifficulty;
    const difficulty: QuestionDifficulty = VALID_DIFFICULTIES.has(rawDiff)
      ? rawDiff
      : "medium";

    const codeSnippet =
      typeof q.codeSnippet === "string" && q.codeSnippet.trim().length > 0
        ? q.codeSnippet.trim()
        : null;

    let options = Array.isArray(q.options)
      ? q.options.map((opt) => String(opt).trim()).filter(Boolean)
      : [];

    let correctAnswer = String(q.correctAnswer ?? "").trim();

    if (questionType === "fact_or_cap") {
      options = ["حقيقة", "هبد"];
      if (correctAnswer !== "حقيقة" && correctAnswer !== "هبد") {
        correctAnswer = /هبد|خطأ|false/i.test(correctAnswer) ? "هبد" : "حقيقة";
      }
    } else {
      if (options.length < 2) {
        throw new Error(`السؤال رقم ${idx + 1} يجب أن يحتوي على خيارين على الأقل.`);
      }
      if (!options.includes(correctAnswer)) {
        options = [correctAnswer || options[0], ...options.slice(0, 3)];
        if (!correctAnswer) {
          correctAnswer = options[0];
        }
      }
    }

    const explanationAr =
      String(q.explanationAr ?? "").trim() ||
      "إجابة مستخرجة من محتوى المنهج المرفق.";

    return {
      draftId: `draft-${idx + 1}-${questionType}`,
      grade: ctx.grade,
      topic: ctx.topic,
      questionType,
      promptAr,
      codeSnippet,
      language,
      options,
      correctAnswer,
      explanationAr,
      difficulty,
      sourcePdfName: ctx.sourceName,
    };
  });

  const rawSheet =
    record.cheatSheet && typeof record.cheatSheet === "object"
      ? (record.cheatSheet as Record<string, unknown>)
      : {};

  const keyTerms = Array.isArray(rawSheet.keyTerms)
    ? rawSheet.keyTerms
        .map((entry) => {
          const obj = (entry && typeof entry === "object"
            ? entry
            : {}) as Record<string, unknown>;
          return {
            term: String(obj.term ?? "").trim(),
            definitionAr: String(obj.definitionAr ?? "").trim(),
          };
        })
        .filter((t) => t.term && t.definitionAr)
    : [];

  const sections = Array.isArray(rawSheet.sections)
    ? rawSheet.sections
        .map((entry) => {
          const obj = (entry && typeof entry === "object"
            ? entry
            : {}) as Record<string, unknown>;
          const bulletsAr = Array.isArray(obj.bulletsAr)
            ? obj.bulletsAr.map((b) => String(b).trim()).filter(Boolean)
            : [];
          return {
            headingAr: String(obj.headingAr ?? "").trim(),
            bulletsAr,
            codeExample:
              typeof obj.codeExample === "string" && obj.codeExample.trim()
                ? obj.codeExample.trim()
                : null,
          };
        })
        .filter((s) => s.headingAr && s.bulletsAr.length > 0)
    : [];

  const cheatSheet: GeneratedCheatSheet = {
    titleAr:
      String(rawSheet.titleAr ?? "").trim() || `ملخص المراجعة — ${ctx.topic}`,
    summaryAr:
      String(rawSheet.summaryAr ?? "").trim() ||
      `ملخص مركز للمفاهيم الأساسية المستخرجة من ${ctx.sourceName}.`,
    keyTerms,
    sections,
  };

  return { questions, cheatSheet };
}
