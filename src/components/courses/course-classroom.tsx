"use client";

import {
  ArrowRight,
  CheckCircle2,
  Code2,
  KeyRound,
  Lock,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProtectedVideoPlayer } from "@/components/courses/protected-video-player";
import { RedeemVoucherModal } from "@/components/store/redeem-voucher-modal";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { CourseDetail } from "@/types/commerce";

interface CourseClassroomProps {
  course: CourseDetail;
  studentName: string;
  studentPhone: string;
  showDemoHints?: boolean;
}

export function CourseClassroom({
  course,
  studentName,
  studentPhone,
  showDemoHints = false,
}: CourseClassroomProps) {
  const [courseState, setCourseState] = useState<CourseDetail>(course);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(
    course.lessons[0]?.id ?? 0,
  );
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const activeLesson =
    courseState.lessons.find((l) => l.id === selectedLessonId) ??
    courseState.lessons[0];

  const handleRedeemed = (payload: { unlockedCourseIds: number[] }) => {
    if (payload.unlockedCourseIds.includes(courseState.id)) {
      setCourseState((prev) => ({
        ...prev,
        isEntitled: true,
        lessons: prev.lessons.map((lesson) => ({ ...lesson, isUnlocked: true })),
      }));
      setRedeemOpen(false);
    }
  };

  const toggleCompleted = (lessonId: number) => {
    setCompletedIds((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId],
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200 hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            العودة إلى الكورسات
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-chalk">
            {courseState.titleAr}
          </h1>
          <p className="mt-1 text-xs text-slate-muted">
            {courseState.grade === "all"
              ? "كل الصفوف"
              : GRADE_LABELS[courseState.grade]}{" "}
            ·{" "}
            {courseState.isEntitled
              ? "مفعّل على حسابك"
              : `${courseState.priceEgp} جنيه مصري`}
          </p>
        </div>

        {!courseState.isEntitled ? (
          <div className="flex items-center gap-2">
            <CyberButton
              variant="cyan"
              size="sm"
              onClick={() => setRedeemOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              تفعيل بكود سنتر
            </CyberButton>
            <CyberButton href="/store" variant="primary" size="sm">
              اشترك عبر المتجر
            </CyberButton>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Main Video & Lesson Notes Stage */}
        <div className="space-y-4 lg:col-span-8">
          {activeLesson ? (
            activeLesson.isUnlocked ? (
              <>
                <ProtectedVideoPlayer
                  lessonTitleAr={activeLesson.titleAr}
                  courseTitleAr={courseState.titleAr}
                  durationSeconds={activeLesson.durationSeconds}
                  bunnyVideoId={activeLesson.bunnyVideoId}
                  studentName={studentName}
                  studentPhone={studentPhone}
                />

                <GlassCard className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="rounded-full border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                        +{activeLesson.xpReward} XP
                      </span>
                      <h2 className="mt-2 text-lg font-extrabold text-white">
                        {activeLesson.titleAr}
                      </h2>
                    </div>

                    <CyberButton
                      variant={
                        completedIds.includes(activeLesson.id)
                          ? "cyan"
                          : "ghost"
                      }
                      size="sm"
                      onClick={() => toggleCompleted(activeLesson.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {completedIds.includes(activeLesson.id)
                        ? "مكتمل"
                        : "تحديد كمكتمل"}
                    </CyberButton>
                  </div>

                  {activeLesson.solutionNotes ? (
                    <p className="mt-3 rounded-xl border border-white/10 bg-obsidian/70 p-3 text-xs leading-relaxed text-chalk/90">
                      {activeLesson.solutionNotes}
                    </p>
                  ) : null}

                  {activeLesson.starterCode ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200">
                          <Code2 className="h-4 w-4" />
                          كود الدرس التطبيقي
                        </span>
                        <Link
                          href="/playground"
                          className="text-xs font-bold text-purple-200 underline-offset-4 hover:underline"
                        >
                          جربه في ملعب الكود
                        </Link>
                      </div>
                      <pre
                        dir="ltr"
                        className="code-ltr overflow-x-auto rounded-xl border border-cyber-cyan/25 bg-[#06070B] p-3.5 text-xs text-cyan-100"
                      >
                        <code>{activeLesson.starterCode}</code>
                      </pre>
                    </div>
                  ) : null}
                </GlassCard>
              </>
            ) : (
              <GlassCard
                data-testid="locked-lesson-card"
                className="flex flex-col items-center justify-center p-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyber-pink/45 bg-cyber-pink/15 text-cyber-pink">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-white">
                  هذا الدرس مقفل للمشتركين فقط
                </h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-muted">
                  فعّل كود السنتر / فودافون كاش أو اشترك في باقة الكورس لفتح جميع الحصص والفيديوهات المحمية فوراً.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <CyberButton
                    variant="primary"
                    onClick={() => setRedeemOpen(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                    تفعيل كود السنتر الآن
                  </CyberButton>
                  <CyberButton href="/store" variant="cyan">
                    <Sparkles className="h-4 w-4" />
                    الذهاب لمتجر الباقات
                  </CyberButton>
                </div>
              </GlassCard>
            )
          ) : null}
        </div>

        {/* Lessons Sidebar */}
        <GlassCard className="h-fit p-4 lg:col-span-4">
          <h3 className="border-b border-white/10 pb-3 text-sm font-extrabold text-chalk">
            محتوى الكورس ({courseState.lessons.length} دروس)
          </h3>

          <div className="mt-3 space-y-2">
            {courseState.lessons.map((lesson, idx) => {
              const isActive = lesson.id === activeLesson?.id;
              const isDone = completedIds.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-2.5 rounded-xl border p-3 text-right transition",
                    isActive
                      ? "border-cyber-cyan/65 bg-cyber-cyan/15"
                      : "border-white/10 bg-obsidian/70 hover:border-cyber-purple/40",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">
                      {!lesson.isUnlocked ? (
                        <Lock className="h-4 w-4 text-cyber-pink" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <PlayCircle className="h-4 w-4 text-cyber-cyan" />
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-chalk">
                        {idx + 1}. {lesson.titleAr}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-muted">
                        {lesson.durationLabelAr}
                        {lesson.isFreePreview && !courseState.isEntitled
                          ? " · معاينة مجانية"
                          : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <RedeemVoucherModal
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onRedeemed={handleRedeemed}
        showDemoHints={showDemoHints}
        initialHintAr={
          showDemoHints
            ? "أدخل كود السنتر أو إنستاباي لفتح هذا الكورس فوراً (جرب CODE-ALGO-1100)."
            : "أدخل كود السنتر أو إنستاباي لفتح هذا الكورس فوراً."
        }
      />
    </div>
  );
}
