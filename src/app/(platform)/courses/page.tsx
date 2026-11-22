import { PhasePlaceholder } from "@/components/dashboard/phase-placeholder";

export default function CoursesPage() {
  return (
    <PhasePlaceholder
      phaseLabel="المرحلة 4 — قريباً"
      titleAr="الكورسات وحصص الفيديو المحمية"
      descriptionAr="منهج أولى وتانية ثانوي مشروح بالفيديو والتطبيقات العملية مع تتبع التقدم وحماية المحتوى."
      accent="purple"
      upcomingFeatures={[
        "مشغل فيديو بعرض علامة مائية متحركة تحمل اسم الطالب ورقم موبايله.",
        "ربط كل درس بمهام عملية في ملعب الكود وتحديث شريط التقدم تلقائياً.",
        "معاينات مجانية مفتوحة للطلبة قبل الاشتراك في الكورس أو الباقة.",
      ]}
    />
  );
}
