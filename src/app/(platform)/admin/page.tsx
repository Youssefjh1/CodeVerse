import { redirect } from "next/navigation";
import { PhasePlaceholder } from "@/components/dashboard/phase-placeholder";
import { getCachedShellData } from "@/lib/data/request-cache";

export default async function AdminPage() {
  const shellData = await getCachedShellData();
  if (!shellData || shellData.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PhasePlaceholder
      phaseLabel="لوحة الإدارة — المراحل 3 و 4"
      titleAr="مركز إدارة CodeVerse ومحرك امتحانات الذكاء الاصطناعي"
      descriptionAr="بوابة المشرف لرفع ملفات المنهج وتحويلها لأسئلة منظمة بالذكاء الاصطناعي وإدارة الطلبات والأكواد."
      accent="pink"
      upcomingFeatures={[
        "رفع ملفات المنهج (PDF) واستخراج أسئلة منظمة عبر Gemini API ثم اعتمادها في بنك الأسئلة.",
        "جدولة الامتحانات الأسبوعية والشهرية تلقائياً لكل صف دراسي.",
        "إدارة أكواد السناتر (Vouchers) ومتابعة شحن طلبات الكتب المطبوعة.",
      ]}
      codeSample={`// Gemini Structured Exam Pipeline (Phase 3)\nconst questions = await extractQuestionsFromPdf({ grade: "grade_11", approveRequired: true });`}
    />
  );
}
