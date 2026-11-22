"use client";

import { CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import type {
  BankQuestion,
  GeneratedQuestionDraft,
  QuestionDifficulty,
  QuestionType,
} from "@/types/arena";

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "اختيار من متعدد",
  fact_or_cap: "حقيقة ولا هبد",
  output_rush: "توقع المخرج",
  debug_duel: "إصلاح خطأ",
};

interface ApprovalQueueProps {
  drafts: GeneratedQuestionDraft[];
  onChangeDrafts: (next: GeneratedQuestionDraft[]) => void;
  onApproved: (saved: BankQuestion[]) => void;
}

export function ApprovalQueue({
  drafts,
  onChangeDrafts,
  onApproved,
}: ApprovalQueueProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateDraft = (
    draftId: string,
    patch: Partial<GeneratedQuestionDraft>,
  ) => {
    onChangeDrafts(
      drafts.map((item) =>
        item.draftId === draftId ? { ...item, ...patch } : item,
      ),
    );
  };

  const approveItems = async (items: GeneratedQuestionDraft[], key: string) => {
    setBusyId(key);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: items.map((item) => ({
            ...item,
            aiGenerated: true,
          })),
        }),
      });
      const data = (await response.json()) as {
        questions?: BankQuestion[];
        error?: string;
      };

      if (!response.ok || !data.questions) {
        setErrorMessage(data.error ?? "تعذر اعتماد الأسئلة.");
        return;
      }

      const approvedIds = new Set(items.map((i) => i.draftId));
      onChangeDrafts(drafts.filter((d) => !approvedIds.has(d.draftId)));
      onApproved(data.questions);
      setSuccessMessage(`تم اعتماد وحفظ ${data.questions.length} سؤال في بنك الأسئلة.`);
    } catch {
      setErrorMessage("حدث خطأ في الاتصال أثناء الحفظ.");
    } finally {
      setBusyId(null);
    }
  };

  if (drafts.length === 0 && !successMessage) {
    return null;
  }

  return (
    <GlassCard data-testid="approval-queue" className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyber-pink" />
          <div>
            <h3 className="text-base font-extrabold text-chalk">
              طابور مراجعة واعتماد المشرف ({drafts.length})
            </h3>
            <p className="text-xs text-slate-muted">
              عدّل أي سؤال أو خيار قبل حفظه رسمياً في QuestionsBank
            </p>
          </div>
        </div>

        {drafts.length > 0 ? (
          <CyberButton
            variant="cyan"
            size="sm"
            disabled={busyId !== null}
            onClick={() => void approveItems(drafts, "all")}
          >
            <CheckCircle2 className="h-4 w-4" />
            {busyId === "all" ? "جاري الحفظ..." : "اعتماد الكل"}
          </CyberButton>
        ) : null}
      </div>

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-3 rounded-xl border border-emerald-400/45 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {drafts.map((draft, idx) => (
          <div
            key={draft.draftId}
            data-testid={`draft-card-${idx}`}
            className="rounded-2xl border border-white/10 bg-obsidian/85 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                  {TYPE_LABELS[draft.questionType]}
                </span>
                <span className="text-xs font-bold text-slate-muted">
                  {draft.topic}
                </span>
              </div>

              <select
                value={draft.difficulty}
                aria-label="مستوى الصعوبة"
                onChange={(e) =>
                  updateDraft(draft.draftId, {
                    difficulty: e.target.value as QuestionDifficulty,
                  })
                }
                className="rounded-lg border border-white/15 bg-obsidian-elevated px-2.5 py-1 text-xs text-chalk"
              >
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">متقدم</option>
              </select>
            </div>

            <div className="mt-3 space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-muted">
                نص السؤال
                <textarea
                  rows={2}
                  value={draft.promptAr}
                  onChange={(e) =>
                    updateDraft(draft.draftId, { promptAr: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk focus:border-cyber-cyan focus:outline-none"
                />
              </label>

              {draft.codeSnippet !== null ? (
                <label className="block text-[11px] font-bold text-slate-muted">
                  مقطع الكود (LTR)
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={draft.codeSnippet}
                    onChange={(e) =>
                      updateDraft(draft.draftId, {
                        codeSnippet: e.target.value,
                      })
                    }
                    className="code-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-cyan-200 focus:border-cyber-cyan focus:outline-none"
                  />
                </label>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {draft.options.map((opt, oIdx) => (
                  <input
                    key={oIdx}
                    type="text"
                    value={opt}
                    disabled={draft.questionType === "fact_or_cap"}
                    aria-label={`الخيار ${oIdx + 1}`}
                    onChange={(e) => {
                      const nextOpts = [...draft.options];
                      const prevVal = nextOpts[oIdx];
                      nextOpts[oIdx] = e.target.value;
                      updateDraft(draft.draftId, {
                        options: nextOpts,
                        correctAnswer:
                          draft.correctAnswer === prevVal
                            ? e.target.value
                            : draft.correctAnswer,
                      });
                    }}
                    className="rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk disabled:opacity-60"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="block text-[11px] font-bold text-slate-muted">
                  الإجابة الصحيحة
                  <select
                    value={draft.correctAnswer}
                    onChange={(e) =>
                      updateDraft(draft.draftId, {
                        correctAnswer: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-emerald-400/40 bg-[#06070B] px-3 py-2 text-xs font-bold text-emerald-200"
                  >
                    {draft.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-bold text-slate-muted">
                  الشرح العربي
                  <input
                    type="text"
                    value={draft.explanationAr}
                    onChange={(e) =>
                      updateDraft(draft.draftId, {
                        explanationAr: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() =>
                  onChangeDrafts(
                    drafts.filter((item) => item.draftId !== draft.draftId),
                  )
                }
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-muted hover:border-rose-500/40 hover:text-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                استبعاد
              </button>

              <CyberButton
                variant="primary"
                size="sm"
                disabled={busyId !== null}
                onClick={() => void approveItems([draft], draft.draftId)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {busyId === draft.draftId ? "جاري الحفظ..." : "اعتماد وحفظ"}
              </CyberButton>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
