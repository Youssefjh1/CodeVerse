"use client";

import {
  CheckCircle2,
  KeyRound,
  Lock,
  PlaySquare,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { RedeemVoucherModal } from "@/components/store/redeem-voucher-modal";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { CourseDetail, CoursesBootstrapData } from "@/types/commerce";

interface CoursesCatalogProps {
  initialData: CoursesBootstrapData;
}

export function CoursesCatalog({ initialData }: CoursesCatalogProps) {
  const [courses, setCourses] = useState<CourseDetail[]>(initialData.courses);
  const [gradeFilter, setGradeFilter] = useState<"all" | "grade_10" | "grade_11">(
    "all",
  );
  const [redeemOpen, setRedeemOpen] = useState(false);

  const visibleCourses = courses.filter(
    (course) =>
      gradeFilter === "all" ||
      course.grade === "all" ||
      course.grade === gradeFilter,
  );

  const handleRedeemed = (payload: { unlockedCourseIds: number[] }) => {
    if (payload.unlockedCourseIds.length === 0) return;
    const unlockedSet = new Set(payload.unlockedCourseIds);
    setCourses((prev) =>
      prev.map((c) =>
        unlockedSet.has(c.id)
          ? {
              ...c,
              isEntitled: true,
              lessons: c.lessons.map((l) => ({ ...l, isUnlocked: true })),
            }
          : c,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-3 py-1 text-xs font-extrabold text-purple-200">
            <PlaySquare className="h-3.5 w-3.5 text-cyber-purple" />
            منصة الحصص المحمية
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            كورسات البرمجة وعلوم الحاسب
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            فيديوهات محمية بعلامة مائية متحركة تحمل اسمك ورقم موبايلك مع تطبيقات عملية فورية.
          </p>
        </div>

        <CyberButton
          variant="cyan"
          size="sm"
          onClick={() => setRedeemOpen(true)}
        >
          <KeyRound className="h-4 w-4" />
          تفعيل كود سنتر / باقة
        </CyberButton>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "كل الصفوف" },
            { id: "grade_10", label: "أولى ثانوي" },
            { id: "grade_11", label: "تانية ثانوي" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setGradeFilter(tab.id)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-extrabold transition",
              gradeFilter === tab.id
                ? "border-cyber-cyan/60 bg-cyber-cyan/15 text-cyan-100"
                : "border-white/10 bg-obsidian-elevated text-slate-muted hover:text-chalk",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleCourses.map((course) => (
          <GlassCard
            key={course.id}
            className="flex flex-col justify-between p-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
                  {course.grade === "all"
                    ? "كل الصفوف"
                    : GRADE_LABELS[course.grade]}
                </span>

                {course.isEntitled ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/45 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {course.isFree ? "مجاني" : "مفعّل"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyber-pink/45 bg-cyber-pink/15 px-2.5 py-0.5 text-[11px] font-extrabold text-pink-200">
                    <Lock className="h-3.5 w-3.5" />
                    {course.priceEgp} جنيه
                  </span>
                )}
              </div>

              <h2 className="text-base font-extrabold text-white">
                {course.titleAr}
              </h2>
              <p className="text-xs leading-relaxed text-slate-muted">
                {course.descriptionAr}
              </p>

              <p className="tabular-nums-ltr font-mono text-[11px] text-purple-200">
                {course.lessons.length} دروس · معاينة مجانية متاحة
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <CyberButton
                href={`/courses/${course.id}`}
                variant={course.isEntitled ? "cyan" : "primary"}
                size="sm"
                className="w-full"
              >
                <Sparkles className="h-4 w-4" />
                {course.isEntitled ? "ابدأ المشاهدة" : "معاينة وتصفح الكورس"}
              </CyberButton>
            </div>
          </GlassCard>
        ))}
      </div>

      <RedeemVoucherModal
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onRedeemed={handleRedeemed}
      />
    </div>
  );
}
