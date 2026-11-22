import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  deleteQuestionById,
  listAllAdminQuestions,
  revalidateArenaAndAdminPaths,
  saveApprovedQuestions,
} from "@/lib/data/phase3-store";
import type {
  QuestionDifficulty,
  QuestionLanguage,
  QuestionType,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

const VALID_TYPES = new Set<QuestionType>([
  "mcq",
  "fact_or_cap",
  "debug_duel",
  "output_rush",
]);
const VALID_GRADES = new Set<GradeTier | "all">([
  "grade_10",
  "grade_11",
  "other",
  "all",
]);
const VALID_LANGS = new Set<QuestionLanguage>([
  "python",
  "javascript",
  "cpp",
  "pseudocode",
  "sql",
]);
const VALID_DIFFS = new Set<QuestionDifficulty>(["easy", "medium", "hard"]);

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }

  const questions = await listAllAdminQuestions(auth.session);
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as {
      questions?: unknown[];
      question?: unknown;
    };

    const rawItems = Array.isArray(body.questions)
      ? body.questions
      : body.question
        ? [body.question]
        : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "لا توجد أسئلة مرسلة للاعتماد." },
        { status: 400 },
      );
    }

    const normalized = rawItems.map((entry, idx) => {
      const item = (entry && typeof entry === "object"
        ? entry
        : {}) as Record<string, unknown>;
      const promptAr = String(item.promptAr ?? "").trim();
      const topic = String(item.topic ?? "").trim() || "عام";
      const rawType = String(item.questionType ?? "mcq") as QuestionType;
      const questionType = VALID_TYPES.has(rawType) ? rawType : "mcq";
      const rawGrade = String(item.grade ?? "grade_11") as GradeTier | "all";
      const grade = VALID_GRADES.has(rawGrade) ? rawGrade : "grade_11";
      const rawLang = String(item.language ?? "python") as QuestionLanguage;
      const language = VALID_LANGS.has(rawLang) ? rawLang : "python";
      const rawDiff = String(item.difficulty ?? "medium") as QuestionDifficulty;
      const difficulty = VALID_DIFFS.has(rawDiff) ? rawDiff : "medium";
      const options = Array.isArray(item.options)
        ? item.options.map((o) => String(o).trim()).filter(Boolean)
        : [];
      const correctAnswer = String(item.correctAnswer ?? "").trim();
      const explanationAr = String(item.explanationAr ?? "").trim();
      const codeSnippet =
        typeof item.codeSnippet === "string" && item.codeSnippet.trim()
          ? item.codeSnippet.trim()
          : null;
      const sourcePdfName =
        typeof item.sourcePdfName === "string" && item.sourcePdfName.trim()
          ? item.sourcePdfName.trim()
          : null;

      if (!promptAr) {
        throw new Error(`السؤال رقم ${idx + 1} يحتاج نصاً واضحاً.`);
      }
      if (options.length < 2) {
        throw new Error(`السؤال رقم ${idx + 1} يحتاج خيارين على الأقل.`);
      }
      if (!correctAnswer || !options.includes(correctAnswer)) {
        throw new Error(`الإجابة الصحيحة للسؤال رقم ${idx + 1} غير مطابقة للخيارات.`);
      }

      return {
        grade,
        topic,
        questionType,
        promptAr,
        codeSnippet,
        language,
        options,
        correctAnswer,
        explanationAr,
        difficulty,
        sourcePdfName,
        aiGenerated: Boolean(item.aiGenerated ?? true),
      };
    });

    const saved = await saveApprovedQuestions(session, normalized);
    revalidateArenaAndAdminPaths();
    return NextResponse.json({ questions: saved }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "تعذر حفظ الأسئلة المعتمدة.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  const rawId = request.nextUrl.searchParams.get("id");
  const questionId = Number(rawId);
  if (!Number.isInteger(questionId) || questionId <= 0) {
    return NextResponse.json({ error: "معرف السؤال غير صالح." }, { status: 400 });
  }

  const deleted = await deleteQuestionById(session, questionId);
  if (!deleted) {
    return NextResponse.json({ error: "تعذر حذف السؤال." }, { status: 404 });
  }

  revalidateArenaAndAdminPaths();
  return NextResponse.json({ ok: true });
}
