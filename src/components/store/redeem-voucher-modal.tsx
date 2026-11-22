"use client";

import { CheckCircle2, KeyRound, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";

interface RedeemVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeemed?: (payload: {
    code: string;
    messageAr: string;
    unlockedCourseIds: number[];
    unlockedProductIds: number[];
  }) => void;
  initialHintAr?: string;
  showDemoHints?: boolean;
}

export function RedeemVoucherModal({
  isOpen,
  onClose,
  onRedeemed,
  initialHintAr,
  showDemoHints = false,
}: RedeemVoucherModalProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage("اكتب كود التفعيل أولاً.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = (await response.json()) as {
        code?: string;
        messageAr?: string;
        unlockedCourseIds?: number[];
        unlockedProductIds?: number[];
        error?: string;
      };

      if (!response.ok || !data.messageAr) {
        setErrorMessage(data.error ?? "تعذر تفعيل الكود.");
        return;
      }

      setSuccessMessage(data.messageAr);
      onRedeemed?.({
        code: data.code ?? code.trim().toUpperCase(),
        messageAr: data.messageAr,
        unlockedCourseIds: data.unlockedCourseIds ?? [],
        unlockedProductIds: data.unlockedProductIds ?? [],
      });
      router.refresh();
    } catch {
      setErrorMessage("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تفعيل كود السنتر أو الخصم"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-cyber-cyan/45 bg-obsidian-elevated p-5 shadow-neon-cyan sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyber-cyan/45 bg-cyber-cyan/15 text-cyber-cyan">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-white">
                تفعيل كود السنتر / الباقة
              </h2>
              <p className="text-[11px] text-slate-muted">
                أكواد إنستاباي وفودافون كاش ومذكرات السناتر
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="إغلاق نافذة تفعيل الكود"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          {initialHintAr ? (
            <p className="rounded-xl border border-cyber-purple/30 bg-cyber-purple/10 px-3 py-2 text-xs text-purple-100">
              {initialHintAr}
            </p>
          ) : null}

          <label className="block text-xs font-bold text-slate-muted">
            كود التفعيل (Voucher Code)
            <input
              type="text"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CODE-XXXX-XXXX"
              aria-label="إدخال كود التفعيل"
              className="code-ltr mt-1.5 w-full rounded-xl border border-white/15 bg-[#06070B] px-3.5 py-2.5 text-sm font-bold tracking-wider text-cyan-200 placeholder:text-slate-500 focus:border-cyber-cyan focus:outline-none"
            />
          </label>

          {showDemoHints ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-muted">
              <span>جرّب كود تجريبي:</span>
              <button
                type="button"
                onClick={() => setCode("CODE-TERM-2026")}
                className="code-ltr rounded-md border border-cyber-cyan/35 bg-cyber-cyan/10 px-2 py-0.5 font-bold text-cyan-200 hover:bg-cyber-cyan/20"
              >
                CODE-TERM-2026
              </button>
              <button
                type="button"
                onClick={() => setCode("CODE-ALGO-1100")}
                className="code-ltr rounded-md border border-cyber-purple/35 bg-cyber-purple/10 px-2 py-0.5 font-bold text-purple-200 hover:bg-cyber-purple/20"
              >
                CODE-ALGO-1100
              </button>
            </div>
          ) : null}

          {errorMessage ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200"
            >
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <CyberButton variant="ghost" size="sm" onClick={onClose}>
              إغلاق
            </CyberButton>
            <CyberButton type="submit" variant="primary" size="sm" disabled={submitting}>
              <Sparkles className="h-4 w-4" />
              {submitting ? "جاري التفعيل..." : "تفعيل الكود الآن"}
            </CyberButton>
          </div>
        </form>
      </div>
    </div>
  );
}
