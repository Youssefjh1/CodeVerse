import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  createScheduledExam,
  listScheduledExams,
  revalidateArenaAndAdminPaths,
  toggleExamPublished,
} from "@/lib/data/phase3-store";
import type { ExamCadence } from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

const VALID_GRADES = new Set<GradeTier | "all">([
  "grade_10",
  "grade_11",
  "other",
  "all",
]);
const VALID_CADENCES = new Set<ExamCadence>(["weekly", "monthly", "practice"]);

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }

  const exams = await listScheduledExams(auth.session, true);
  return NextResponse.json({ exams });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const titleAr = String(body.titleAr ?? "").trim();
    if (!titleAr) {
      return NextResponse.json(
        { error: "اكتب عنواناً للامتحان المجدول." },
        { status: 400 },
      );
    }

    const rawGrade = String(body.grade ?? "grade_11") as GradeTier | "all";
    const grade = VALID_GRADES.has(rawGrade) ? rawGrade : "grade_11";
    const rawCadence = String(body.examCadence ?? "weekly") as ExamCadence;
    const examCadence = VALID_CADENCES.has(rawCadence) ? rawCadence : "weekly";

    const questionCount = Math.min(
      50,
      Math.max(1, Math.round(Number(body.questionCount) || 5)),
    );
    const durationMinutes = Math.min(
      180,
      Math.max(1, Math.round(Number(body.durationMinutes) || 15)),
    );
    const xpReward = Math.max(0, Math.round(Number(body.xpReward) || 200));
    const coinsReward = Math.max(0, Math.round(Number(body.coinsReward) || 60));

    const startsAt =
      typeof body.startsAt === "string" && body.startsAt.trim()
        ? body.startsAt.trim()
        : null;
    const endsAt =
      typeof body.endsAt === "string" && body.endsAt.trim()
        ? body.endsAt.trim()
        : null;
    const isPublished = body.isPublished !== false;

    const exam = await createScheduledExam(session, {
      titleAr,
      grade,
      examCadence,
      questionCount,
      durationMinutes,
      xpReward,
      coinsReward,
      startsAt,
      endsAt,
      isPublished,
    });

    revalidateArenaAndAdminPaths();
    return NextResponse.json({ exam }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "تعذر إنشاء الامتحان المجدول.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as {
      examId?: number;
      isPublished?: boolean;
    };
    const examId = Number(body.examId);
    if (!Number.isInteger(examId) || examId <= 0) {
      return NextResponse.json(
        { error: "معرف الامتحان غير صالح." },
        { status: 400 },
      );
    }

    const updated = await toggleExamPublished(
      session,
      examId,
      Boolean(body.isPublished),
    );
    if (!updated) {
      return NextResponse.json(
        { error: "الامتحان غير موجود." },
        { status: 404 },
      );
    }
    revalidateArenaAndAdminPaths();
    return NextResponse.json({ exam: updated });
  } catch {
    return NextResponse.json(
      { error: "تعذر تحديث حالة نشر الامتحان." },
      { status: 400 },
    );
  }
}
