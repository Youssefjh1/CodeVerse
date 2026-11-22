import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as generateRoutePost } from "@/app/api/admin/ai-engine/generate/route";
import { POST as questionsRoutePost } from "@/app/api/admin/questions/route";
import { generateCurriculumExamPackage } from "@/lib/ai/gemini-exam-generator";
import { parseAndValidateAiPayload } from "@/lib/ai/schema";
import { getCurrentSession } from "@/lib/auth/session";

const { createInteractionMock } = vi.hoisted(() => ({
  createInteractionMock: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    interactions: {
      create: createInteractionMock,
    },
  })),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: vi.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.GEMINI_API_KEY;
  createInteractionMock.mockReset();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Admin AI Exam Engine & Security Guards", () => {
  it("parses and normalizes Gemini structured JSON output and rejects invalid payloads", () => {
    const raw = JSON.stringify({
      questions: [
        {
          questionType: "fact_or_cap",
          promptAr: "البحث الثنائي يحتاج مصفوفة مرتبة.",
          codeSnippet: null,
          language: "pseudocode",
          options: ["صواب", "خطأ"],
          correctAnswer: "حقيقة",
          explanationAr: "يعتمد البحث الثنائي على الترتيب.",
          difficulty: "easy",
        },
        {
          questionType: "output_rush",
          promptAr: "ما ناتج الطباعة؟",
          codeSnippet: "print(2 + 3)",
          language: "python",
          options: ["5", "6", "4", "23"],
          correctAnswer: "5",
          explanationAr: "2 + 3 = 5",
          difficulty: "easy",
        },
      ],
      cheatSheet: {
        titleAr: "ملخص البحث الثنائي",
        summaryAr: "مفاهيم أساسية",
        keyTerms: [{ term: "Binary Search", definitionAr: "بحث ثنائي سريع" }],
        sections: [
          {
            headingAr: "الشرط الأساسي",
            bulletsAr: ["ترتيب المصفوفة قبل البحث"],
            codeExample: "mid = (low + high) // 2",
          },
        ],
      },
    });

    const parsed = parseAndValidateAiPayload(raw, {
      grade: "grade_11",
      topic: "الخوارزميات",
      sourceName: "lesson.pdf",
    });

    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].options).toEqual(["حقيقة", "هبد"]);
    expect(parsed.cheatSheet.titleAr).toBe("ملخص البحث الثنائي");

    expect(() =>
      parseAndValidateAiPayload("not json", {
        grade: "grade_11",
        topic: "test",
        sourceName: "test.txt",
      }),
    ).toThrow(/JSON/);
  });

  it("calls @google/genai interactions.create with gemini-4-hydrogen, PDF inline block, and JSON response_format", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    createInteractionMock.mockResolvedValueOnce({
      output_text: JSON.stringify({
        questions: [
          {
            questionType: "mcq",
            promptAr: "ما تعقيد البحث الثنائي؟",
            codeSnippet: null,
            language: "pseudocode",
            options: ["O(log n)", "O(n)", "O(n^2)", "O(1)"],
            correctAnswer: "O(log n)",
            explanationAr: "يتم تقسيم النطاق للنصف في كل خطوة.",
            difficulty: "medium",
          },
        ],
        cheatSheet: {
          titleAr: "مراجعة الخوارزميات",
          summaryAr: "خلاصة من PDF",
          keyTerms: [{ term: "O(log n)", definitionAr: "نمو لوغاريتمي" }],
          sections: [
            {
              headingAr: "ملخص",
              bulletsAr: ["تقسيم النطاق"],
              codeExample: null,
            },
          ],
        },
      }),
    });

    const result = await generateCurriculumExamPackage({
      curriculumText: "",
      pdfBase64: Buffer.from("%PDF-1.4 sample").toString("base64"),
      sourceName: "algorithms.pdf",
      grade: "grade_11",
      topic: "الخوارزميات",
      mcqCount: 1,
      factOrCapCount: 1,
      outputRushCount: 1,
    });

    expect(result.provider).toBe("gemini");
    expect(result.modelUsed).toBe("gemini-4-hydrogen");
    expect(createInteractionMock).toHaveBeenCalledTimes(1);

    const callArg = createInteractionMock.mock.calls[0][0] as {
      model: string;
      input: Array<{ type: string; mime_type?: string }>;
      response_format: { type: string; mime_type: string };
      system_instruction: string;
    };
    expect(callArg.model).toBe("gemini-4-hydrogen");
    expect(callArg.response_format.type).toBe("text");
    expect(callArg.response_format.mime_type).toBe("application/json");
    expect(callArg.input[0]).toMatchObject({
      type: "document",
      mime_type: "application/pdf",
    });
    expect(callArg.system_instruction).toMatch(/المادة العلمية الموجودة في ملف PDF/);
  });

  it("falls back to grounded demo extractor when GEMINI_API_KEY is absent in Demo Mode", async () => {
    const result = await generateCurriculumExamPackage({
      curriculumText: "المكدس Stack يعتمد مبدأ LIFO، والطابور Queue يعتمد مبدأ FIFO.",
      sourceName: "stacks.txt",
      grade: "grade_11",
      topic: "هياكل البيانات",
      mcqCount: 1,
      factOrCapCount: 1,
      outputRushCount: 1,
    });

    expect(result.provider).toBe("demo");
    expect(result.questions).toHaveLength(3);
    expect(result.cheatSheet.sections.length).toBeGreaterThan(0);
  });

  it("enforces admin role on AI generate and QuestionsBank endpoints (401 & 403)", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/questions", {
      method: "POST",
      body: JSON.stringify({ questions: [] }),
    });
    const unauthRes = await questionsRoutePost(unauthReq);
    expect(unauthRes.status).toBe(401);

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "student-1",
      fullName: "طالب",
      email: "student@codeverse.eg",
      grade: "grade_10",
      role: "student",
      avatarFrame: "electric_violet",
    });
    const form = new FormData();
    form.set("curriculumText", "اختبار");
    const studentReq = new Request("http://localhost:3000/api/admin/ai-engine/generate", {
      method: "POST",
      body: form,
    });
    const studentRes = await generateRoutePost(studentReq);
    expect(studentRes.status).toBe(403);
  });

  it("handles POST /api/admin/ai-engine/generate even when global File is undefined (Node 18)", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "admin-1",
      fullName: "مشرف المنصة",
      email: "admin@codeverse.eg",
      grade: "grade_11",
      role: "admin",
      avatarFrame: "electric_violet",
    });

    const originalFile = globalThis.File;
    // Simulate Node 18 runtime without global File constructor
    // @ts-expect-error testing Node 18 missing global File
    delete globalThis.File;

    try {
      const form = new FormData();
      form.set("curriculumText", "البحث الثنائي يعمل على المصفوفات المرتبة فقط بتعقيد O(log n).");
      form.set("grade", "grade_11");
      form.set("topic", "البحث الثنائي");

      const req = new Request("http://localhost:3000/api/admin/ai-engine/generate", {
        method: "POST",
        body: form,
      });

      const res = await generateRoutePost(req);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { questions: unknown[]; cheatSheet: { titleAr: string } };
      expect(data.questions.length).toBeGreaterThan(0);
      expect(data.cheatSheet.titleAr).toContain("البحث الثنائي");
    } finally {
      globalThis.File = originalFile;
    }
  });
});
