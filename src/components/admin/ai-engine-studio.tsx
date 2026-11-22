"use client";

import {
  BrainCircuit,
  Database,
  FileUp,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ApprovalQueue } from "@/components/admin/approval-queue";
import { CheatSheetViewer } from "@/components/admin/cheat-sheet-viewer";
import { ExamScheduler } from "@/components/admin/exam-scheduler";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import type {
  AiGenerationResult,
  BankQuestion,
  GeneratedCheatSheet,
  GeneratedQuestionDraft,
  ScheduledExam,
} from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

const SAMPLE_CURRICULUM_TEXT = `الوحدة الثانية: البحث الثنائي Binary Search وهياكل البيانات.
تعمل خوارزمية البحث الثنائي على المصفوفات المرتبة فقط بتعقيد زمني O(log n)، حيث نقسم نطاق البحث إلى نصفين في كل خطوة بمقارنة العنصر الأوسط mid بالهدف target.
المكدس Stack يعتمد مبدأ LIFO (آخر ما يدخل يخرج أولاً) مثل زر الرجوع في المتصفح، بينما الطابور Queue يعتمد مبدأ FIFO (أول ما يدخل يخرج أولاً).
مثال بايثون:
arr = [2, 6, 10, 14]
print(len(arr) * 2)`;

interface AiEngineStudioProps {
  initialQuestions: BankQuestion[];
  initialExams: ScheduledExam[];
}

export function AiEngineStudio({
  initialQuestions,
  initialExams,
}: AiEngineStudioProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [curriculumText, setCurriculumText] = useState("");
  const [grade, setGrade] = useState<GradeTier | "all">("grade_11");
  const [topic, setTopic] = useState("البحث الثنائي وهياكل البيانات");
  const [mcqCount, setMcqCount] = useState(2);
  const [factOrCapCount, setFactOrCapCount] = useState(2);
  const [outputRushCount, setOutputRushCount] = useState(1);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [providerBadge, setProviderBadge] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<GeneratedQuestionDraft[]>([]);
  const [cheatSheet, setCheatSheet] = useState<GeneratedCheatSheet | null>(null);

  const [questionsBank, setQuestionsBank] =
    useState<BankQuestion[]>(initialQuestions);
  const [exams, setExams] = useState<ScheduledExam[]>(initialExams);
  const [bankFilterGrade, setBankFilterGrade] = useState<
    "all" | "grade_10" | "grade_11"
  >("all");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("curriculumText", curriculumText);
      formData.append("grade", grade);
      formData.append("topic", topic);
      formData.append("mcqCount", String(mcqCount));
      formData.append("factOrCapCount", String(factOrCapCount));
      formData.append("outputRushCount", String(outputRushCount));

      const response = await fetch("/api/admin/ai-engine/generate", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AiGenerationResult & {
        error?: string;
      };
      if (!response.ok || !data.questions) {
        setGenError(data.error ?? "تعذر تحليل المادة وتوليد الأسئلة.");
        return;
      }

      setDrafts(data.questions);
      setCheatSheet(data.cheatSheet);
      setProviderBadge(
        data.provider === "gemini"
          ? `Gemini API (${data.modelUsed})`
          : "Demo Grounded Extractor (بدون مفتاح Gemini)",
      );
    } catch {
      setGenError("حدث خطأ في الاتصال أثناء توليد الأسئلة.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBankQuestion = async (id: number) => {
    const response = await fetch(`/api/admin/questions?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setQuestionsBank((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const visibleBankQuestions = questionsBank.filter(
    (q) =>
      bankFilterGrade === "all" ||
      q.grade === "all" ||
      q.grade === bankFilterGrade,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-3 py-1 text-xs font-extrabold text-purple-200">
            <BrainCircuit className="h-3.5 w-3.5 text-cyber-purple" />
            محرك الامتحانات بالذكاء الاصطناعي
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            تحويل ملفات المنهج إلى أسئلة ومراجعات معتمدة
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            ارفع ملف PDF أو الصق نص الدرس لتوليد أسئلة منظمة وورقة مراجعة مقيدة بالمصدر فقط عبر Gemini API.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-obsidian-elevated px-4 py-2 text-xs font-bold text-chalk sm:self-auto">
          <Database className="h-4 w-4 text-cyber-cyan" />
          <span className="tabular-nums-ltr font-mono" data-testid="bank-count">
            {questionsBank.length}
          </span>
          <span>سؤال في QuestionsBank</span>
        </div>
      </header>

      {/* Upload & Generate Form */}
      <GlassCard variant="hero" className="p-5 sm:p-6">
        <form onSubmit={(e) => void handleGenerate(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <label className="block rounded-2xl border border-dashed border-cyber-cyan/40 bg-obsidian/80 p-4 text-center transition hover:border-cyber-cyan">
                <FileUp className="mx-auto h-7 w-7 text-cyber-cyan" />
                <p className="mt-2 text-xs font-extrabold text-chalk">
                  ارفع ملف المنهج (PDF أو TXT / MD)
                </p>
                <p className="mt-1 text-[11px] text-slate-muted">
                  {selectedFile
                    ? `تم اختيار: ${selectedFile.name}`
                    : "حد أقصى 10 ميجابايت"}
                </p>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.csv"
                  aria-label="رفع ملف المنهج"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs text-slate-muted file:ml-3 file:rounded-lg file:border-0 file:bg-cyber-cyan/20 file:px-3 file:py-1 file:text-xs file:font-bold file:text-cyan-100"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs font-bold text-slate-muted">
                  الصف الدراسي
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeTier | "all")}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  >
                    <option value="grade_10">أولى ثانوي</option>
                    <option value="grade_11">تانية ثانوي</option>
                    <option value="all">كل الصفوف</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-muted">
                  عنوان الدرس / الموضوع
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block text-[11px] font-bold text-slate-muted">
                  أسئلة MCQ
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={mcqCount}
                    onChange={(e) => setMcqCount(Number(e.target.value))}
                    className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-2.5 py-1.5 font-mono text-xs text-chalk"
                  />
                </label>
                <label className="block text-[11px] font-bold text-slate-muted">
                  حقيقة/هبد
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={factOrCapCount}
                    onChange={(e) => setFactOrCapCount(Number(e.target.value))}
                    className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-2.5 py-1.5 font-mono text-xs text-chalk"
                  />
                </label>
                <label className="block text-[11px] font-bold text-slate-muted">
                  توقع مخرج
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={outputRushCount}
                    onChange={(e) => setOutputRushCount(Number(e.target.value))}
                    className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-2.5 py-1.5 font-mono text-xs text-chalk"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-2 lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="curriculum-text-input"
                  className="text-xs font-bold text-chalk"
                >
                  نص الدرس أو الملزمة (بديل أو داعم للـ PDF)
                </label>
                <button
                  type="button"
                  onClick={() => setCurriculumText(SAMPLE_CURRICULUM_TEXT)}
                  className="rounded-lg border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-cyber-purple/25"
                >
                  تحميل مثال منهج تانية ثانوي
                </button>
              </div>

              <textarea
                id="curriculum-text-input"
                rows={8}
                value={curriculumText}
                onChange={(e) => setCurriculumText(e.target.value)}
                placeholder="الصق فقرات المنهج أو الشرح هنا ليقوم Gemini باستخراج الأسئلة وورقة المراجعة منها حصراً..."
                className="w-full flex-1 rounded-2xl border border-white/15 bg-[#06070B] p-3.5 text-xs leading-6 text-chalk placeholder:text-slate-500 focus:border-cyber-cyan focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {providerBadge ? (
                  <span className="rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
                    المزود: {providerBadge}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-muted">
                    مخرجات JSON منظمة ومقيدة بالمصدر المرفق فقط
                  </span>
                )}

                <CyberButton type="submit" variant="primary" disabled={generating}>
                  <Sparkles className="h-4 w-4" />
                  {generating
                    ? "جاري التحليل والتوليد..."
                    : "توليد الأسئلة وورقة المراجعة"}
                </CyberButton>
              </div>
            </div>
          </div>
        </form>

        {genError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200"
          >
            {genError}
          </p>
        ) : null}
      </GlassCard>

      {/* Cheat Sheet + Approval Queue */}
      {cheatSheet ? <CheatSheetViewer cheatSheet={cheatSheet} /> : null}

      <ApprovalQueue
        drafts={drafts}
        onChangeDrafts={setDrafts}
        onApproved={(saved) =>
          setQuestionsBank((prev) => [...saved, ...prev])
        }
      />

      {/* Exam Scheduler */}
      <ExamScheduler
        exams={exams}
        approvedQuestionCount={questionsBank.length}
        onExamCreated={(exam) => setExams((prev) => [exam, ...prev])}
        onExamUpdated={(updated) =>
          setExams((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          )
        }
      />

      {/* Approved QuestionsBank Browser */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <h3 className="text-base font-extrabold text-chalk">
              بنك الأسئلة المعتمد (QuestionsBank)
            </h3>
            <p className="text-xs text-slate-muted">
              جميع الأسئلة المعتمدة والجاهزة للسحب في ساحة التحديات والامتحانات
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-obsidian p-1 text-xs">
            {(
              [
                { id: "all", label: "الكل" },
                { id: "grade_10", label: "أولى ثانوي" },
                { id: "grade_11", label: "تانية ثانوي" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBankFilterGrade(f.id)}
                className={
                  bankFilterGrade === f.id
                    ? "rounded-lg bg-cyber-cyan/20 px-2.5 py-1 font-bold text-cyan-100"
                    : "rounded-lg px-2.5 py-1 font-bold text-slate-muted hover:text-chalk"
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {visibleBankQuestions.slice(0, 12).map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-obsidian/80 px-4 py-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-cyber-purple/40 bg-cyber-purple/15 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                    {q.questionType}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-cyan-200">
                    {q.grade === "all" ? "كل الصفوف" : GRADE_LABELS[q.grade]}
                  </span>
                  <span className="text-[11px] font-bold text-slate-muted">
                    {q.topic}
                  </span>
                </div>
                <p className="font-bold text-chalk">{q.promptAr}</p>
                <p className="text-[11px] text-emerald-300">
                  الإجابة المعتمدة: {q.correctAnswer}
                </p>
              </div>

              <button
                type="button"
                aria-label={`حذف السؤال ${q.id}`}
                onClick={() => void handleDeleteBankQuestion(q.id)}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-muted hover:border-rose-500/40 hover:text-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
