import { PhasePlaceholder } from "@/components/dashboard/phase-placeholder";

export default function ArenaPage() {
  return (
    <PhasePlaceholder
      phaseLabel="المرحلة 3 — قريباً"
      titleAr="ساحة التحديات والبطولات (Code & Theory Arena)"
      descriptionAr="منافسات سريعة في النظري وحل الأخطاء مع لوحة شرف أسبوعية لكل صف دراسي."
      accent="pink"
      upcomingFeatures={[
        "تحدي Fact or Cap لأسئلة مفاهيم علوم الحاسب السريعة.",
        "مبارزات Debug Duel لاكتشاف الأخطاء وإصلاحها قبل انتهاء الوقت.",
        "تحدي Output Rush ومباريات 1v1 Flash Blitz عبر Supabase Realtime.",
        "لوحات شرف منفصلة لكل صف دراسي وموسم أسبوعي.",
      ]}
    />
  );
}
