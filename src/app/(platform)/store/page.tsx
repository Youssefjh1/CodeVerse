import { PhasePlaceholder } from "@/components/dashboard/phase-placeholder";

export default function StorePage() {
  return (
    <PhasePlaceholder
      phaseLabel="المرحلة 4 — قريباً"
      titleAr="متجر الملازم والكتب المطبوعة والباقات"
      descriptionAr="احصل على ملازم الـ PDF المحمية أو اطلب الكتب المطبوعة للشحن، وفعل أكواد السناتر والخصومات."
      accent="cyan"
      upcomingFeatures={[
        "عارض PDF محمي داخل المنصة للمذكرات الرقمية بدون تحميل غير مصرح.",
        "نموذج طلب شحن الكتب المطبوعة لجميع المحافظات في مصر.",
        "نظام الباقات المجمعة وتفعيل أكواد السناتر (Vouchers).",
        "ربط الدفع الإلكتروني عبر Paymob وFawry.",
      ]}
    />
  );
}
