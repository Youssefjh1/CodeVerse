import { GoogleGenAI } from "@google/genai";
import { generateDemoGroundedDrafts } from "@/lib/ai/demo-extractor";
import {
  AI_EXAM_RESPONSE_JSON_SCHEMA,
  parseAndValidateAiPayload,
  STRICT_GROUNDING_SYSTEM_PROMPT,
} from "@/lib/ai/schema";
import { isDemoModeEnabled } from "@/lib/supabase/config";
import type { AiGenerationResult } from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

export class AiServiceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiServiceConfigError";
  }
}

export interface GenerateCurriculumInput {
  curriculumText: string;
  pdfBase64?: string | null;
  sourceName: string;
  grade: GradeTier | "all";
  topic: string;
  mcqCount: number;
  factOrCapCount: number;
  outputRushCount: number;
}

const DEFAULT_GEMINI_MODEL = "gemini-4-hydrogen";

export async function generateCurriculumExamPackage(
  params: GenerateCurriculumInput,
): Promise<AiGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    if (isDemoModeEnabled()) {
      return generateDemoGroundedDrafts({
        curriculumText: params.curriculumText,
        sourceName: params.sourceName,
        grade: params.grade,
        topic: params.topic,
        mcqCount: params.mcqCount,
        factOrCapCount: params.factOrCapCount,
        outputRushCount: params.outputRushCount,
      });
    }
    throw new AiServiceConfigError(
      "مفتاح GEMINI_API_KEY غير مضبوط في متغيرات البيئة.",
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  const gradeArabic =
    params.grade === "grade_10"
      ? "الصف الأول الثانوي"
      : params.grade === "grade_11"
        ? "الصف الثاني الثانوي"
        : "المرحلة الثانوية";

  const instructionPrompt = [
    `الموضوع المستهدف: ${params.topic}`,
    `الصف الدراسي: ${gradeArabic}`,
    `المصدر المرفق: ${params.sourceName}`,
    `المطلوب توليده بالضبط اعتماداً على المحتوى المرفق فقط:`,
    `- عدد ${params.mcqCount} سؤال اختيار من متعدد (questionType: "mcq")`,
    `- عدد ${params.factOrCapCount} جملة حقيقة ولا هبد (questionType: "fact_or_cap" مع خيارات ["حقيقة", "هبد"])`,
    `- عدد ${params.outputRushCount} سؤال توقع مخرج الكود (questionType: "output_rush")`,
    `- ورقة مراجعة عربية مختصرة (cheatSheet) تشمل المصطلحات والأفكار الرئيسية وأمثلة الكود إن وجدت في النص.`,
    params.curriculumText.trim()
      ? `\nالنص الدراسي المرفق:\n"""\n${params.curriculumText.trim()}\n"""`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const inputBlocks: Array<
    | { type: "document"; data: string; mime_type: "application/pdf" }
    | { type: "text"; text: string }
  > = [];

  if (params.pdfBase64) {
    inputBlocks.push({
      type: "document",
      data: params.pdfBase64,
      mime_type: "application/pdf",
    });
  }
  inputBlocks.push({
    type: "text",
    text: instructionPrompt,
  });

  const interaction = await ai.interactions.create({
    model,
    system_instruction: STRICT_GROUNDING_SYSTEM_PROMPT,
    input: inputBlocks,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: AI_EXAM_RESPONSE_JSON_SCHEMA,
    },
    store: false,
  });

  const rawText = interaction.output_text ?? "";
  const validated = parseAndValidateAiPayload(rawText, {
    grade: params.grade,
    topic: params.topic,
    sourceName: params.sourceName,
  });

  return {
    provider: "gemini",
    modelUsed: model,
    sourceName: params.sourceName,
    questions: validated.questions,
    cheatSheet: validated.cheatSheet,
  };
}
