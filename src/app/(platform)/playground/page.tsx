import { PhasePlaceholder } from "@/components/dashboard/phase-placeholder";

export default function PlaygroundPage() {
  return (
    <PhasePlaceholder
      phaseLabel="المرحلة 2 — قريباً"
      titleAr="ملعب الكود والمصور التفاعلي (Code Visualizer)"
      descriptionAr="محرر أكواد متكامل باستخدام Monaco Editor مع تنفيذ الكود سطر بسطر وتتبع المتغيرات في الذاكرة لحظياً."
      accent="cyan"
      upcomingFeatures={[
        "محرر كود بواجهة LTR وخط JetBrains Mono ودعم Python وJavaScript وC++.",
        "تظليل السطر المنفذ لحظياً (Step-by-Step Line Execution).",
        "عارض الذاكرة والمتغيرات (Memory & Variables Inspector) أثناء التشغيل.",
        "شاشة مخرجات متحركة (Animated Output Console) لعرض النتائج والأخطاء.",
      ]}
      codeSample={`for step, item in enumerate(["stack", "heap", "output"]):\n    trace_frame(line=step + 1, variable=item)`}
    />
  );
}
