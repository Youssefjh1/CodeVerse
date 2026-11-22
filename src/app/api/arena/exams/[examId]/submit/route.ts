import { NextResponse } from "next/server";
import { gradeExamAnswers } from "@/lib/arena/scoring";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getExamWithQuestions, recordExamAttempt } from "@/lib/data/phase3-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireAuthenticatedSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  const { examId } = await context.params;
  const numericId = Number(examId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "معرف الامتحان غير صالح." }, { status: 400 });
  }

  const payload = await getExamWithQuestions(session, numericId);
  if (!payload) {
    return NextResponse.json(
      { error: "الامتحان غير متاح." },
      { status: 404 },
    );
  }

  let answers: Record<string, string> = {};
  try {
    const body = (await request.json()) as { answers?: Record<string, string> };
    if (body.answers && typeof body.answers === "object") {
      answers = body.answers;
    }
  } catch {
    return NextResponse.json({ error: "صيغة الإجابات غير صالحة." }, { status: 400 });
  }

  const grading = gradeExamAnswers(payload.questions, answers, payload.exam);

  await recordExamAttempt(session, {
    examId: payload.exam.id,
    answers,
    scorePercent: grading.scorePercent,
    xpAwarded: grading.xpAwarded,
  });

  return NextResponse.json(grading, { status: 200 });
}
