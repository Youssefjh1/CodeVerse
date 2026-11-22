import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AiEngineStudio } from "@/components/admin/ai-engine-studio";
import { getCurrentSession } from "@/lib/auth/session";
import {
  listAllAdminQuestions,
  listScheduledExams,
} from "@/lib/data/phase3-store";

export const metadata: Metadata = {
  title: "محرك الامتحانات AI | CodeVerse",
  description:
    "توليد أسئلة ومراجعات عربية مقيدة بملفات المنهج عبر Gemini API واعتمادها في بنك الأسئلة.",
};

export default async function AdminAiEnginePage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const [questions, exams] = await Promise.all([
    listAllAdminQuestions(session),
    listScheduledExams(session, true),
  ]);

  return (
    <AiEngineStudio initialQuestions={questions} initialExams={exams} />
  );
}
