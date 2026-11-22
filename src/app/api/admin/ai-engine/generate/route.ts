import { NextResponse } from "next/server";
import {
  AiServiceConfigError,
  generateCurriculumExamPackage,
} from "@/lib/ai/gemini-exam-generator";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  applyRateLimitHeaders,
  checkDualRateLimit,
  createRateLimitResponse,
  getAiGenerateRateLimitConfig,
} from "@/lib/security/rate-limit";
import type { GradeTier } from "@/types/gamification";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const VALID_GRADES = new Set<GradeTier | "all">([
  "grade_10",
  "grade_11",
  "other",
  "all",
]);

function clampCount(raw: FormDataEntryValue | null, fallback: number, max: number): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 1) return fallback;
  return Math.min(max, Math.round(num));
}

interface UploadedBlobLike {
  name?: string;
  type?: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

function asUploadedFile(entry: FormDataEntryValue | null): UploadedBlobLike | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const candidate = entry as Partial<UploadedBlobLike>;
  if (
    typeof candidate.arrayBuffer === "function" &&
    typeof candidate.size === "number" &&
    candidate.size > 0
  ) {
    return candidate as UploadedBlobLike;
  }
  return null;
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }

  const rateLimit = checkDualRateLimit({
    namespace: "ai-generate",
    userId: auth.session.userId,
    request,
    ...getAiGenerateRateLimitConfig(),
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      `تم تجاوز الحد المسموح لطلبات توليد الأسئلة بالذكاء الاصطناعي. حاول مجدداً بعد ${rateLimit.retryAfterSeconds} ثانية.`,
    );
  }

  try {
    const formData = await request.formData();
    const rawGrade = String(formData.get("grade") ?? "grade_11") as
      | GradeTier
      | "all";
    const grade = VALID_GRADES.has(rawGrade) ? rawGrade : "grade_11";
    const topic =
      String(formData.get("topic") ?? "").trim() || "مراجعة علوم الحاسب والبرمجة";
    let curriculumText = String(formData.get("curriculumText") ?? "").trim();

    const mcqCount = clampCount(formData.get("mcqCount"), 2, 6);
    const factOrCapCount = clampCount(formData.get("factOrCapCount"), 2, 6);
    const outputRushCount = clampCount(formData.get("outputRushCount"), 1, 4);

    let pdfBase64: string | null = null;
    let sourceName = "نص منهج مباشر";

    const uploaded = asUploadedFile(formData.get("file"));
    if (uploaded) {
      if (uploaded.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "حجم الملف يتجاوز الحد الأقصى المسموح (10 ميجابايت)." },
          { status: 400 },
        );
      }

      sourceName = uploaded.name || "uploaded-curriculum";
      const lowerName = sourceName.toLowerCase();
      const mimeType = uploaded.type ?? "";
      const isPdf =
        mimeType === "application/pdf" || lowerName.endsWith(".pdf");
      const isText =
        mimeType.startsWith("text/") ||
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".csv");

      if (!isPdf && !isText) {
        return NextResponse.json(
          { error: "صيغة الملف غير مدعومة. ارفع ملف PDF أو TXT أو MD." },
          { status: 400 },
        );
      }

      const bytes = Buffer.from(await uploaded.arrayBuffer());
      if (isPdf) {
        pdfBase64 = bytes.toString("base64");
      } else {
        const decoded = bytes.toString("utf8").trim();
        curriculumText = [curriculumText, decoded].filter(Boolean).join("\n\n");
      }
    }

    if (!pdfBase64 && !curriculumText) {
      return NextResponse.json(
        { error: "ارفع ملف المنهج (PDF/TXT) أو الصق النص الدراسي أولاً." },
        { status: 400 },
      );
    }

    const result = await generateCurriculumExamPackage({
      curriculumText,
      pdfBase64,
      sourceName,
      grade,
      topic,
      mcqCount,
      factOrCapCount,
      outputRushCount,
    });

    return applyRateLimitHeaders(
      NextResponse.json(result, { status: 200 }),
      rateLimit,
    );
  } catch (err) {
    if (err instanceof AiServiceConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[ai-engine/generate]", err);
      return NextResponse.json(
        { error: "تعذر توليد الأسئلة من المحتوى المرفق حالياً." },
        { status: 500 },
      );
    }
    const message =
      err instanceof Error ? err.message : "تعذر توليد الأسئلة من المحتوى المرفق.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
