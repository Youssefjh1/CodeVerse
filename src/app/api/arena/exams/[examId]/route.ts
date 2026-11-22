import { NextResponse } from "next/server";
import { sanitizeQuestionsForStudent } from "@/lib/arena/scoring";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getExamWithQuestions } from "@/lib/data/phase3-store";

export async function GET(
  _request: Request,
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
      { error: "الامتحان غير متاح أو غير منشور." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    exam: payload.exam,
    questions: sanitizeQuestionsForStudent(payload.questions),
  });
}
