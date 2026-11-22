"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import type { StoreProduct } from "@/types/commerce";

interface ProtectedPdfViewerProps {
  product: StoreProduct | null;
  studentName: string;
  studentPhone: string;
  onClose: () => void;
}

export function ProtectedPdfViewer({
  product,
  studentName,
  studentPhone,
  onClose,
}: ProtectedPdfViewerProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setPageIndex(0);
    setZoom(100);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && (event.key === "s" || event.key === "p")) {
        event.preventDefault();
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const pages = product.pages ?? [];
  const activePage = pages[pageIndex] ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`عارض الملزمة المحمي — ${product.titleAr}`}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md select-none sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyber-cyan/45 bg-obsidian-elevated shadow-neon-cyan">
        {/* Viewer Toolbar (strictly no download/print button) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-obsidian/90 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/15 text-cyber-cyan">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {product.titleAr}
              </h2>
              <p className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                <Lock className="h-3 w-3" />
                قارئ محمي داخل التطبيق (ممنوع التحميل أو الطباعة)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="تصغير النص"
              onClick={() => setZoom((z) => Math.max(85, z - 15))}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-muted hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="tabular-nums-ltr font-mono text-xs font-bold text-cyan-200">
              {zoom}%
            </span>
            <button
              type="button"
              aria-label="تكبير النص"
              onClick={() => setZoom((z) => Math.min(130, z + 15))}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-muted hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="إغلاق عارض PDF"
              onClick={onClose}
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-chalk hover:border-cyber-pink/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Protected Page Surface with Student Watermark */}
        <div className="relative flex-1 overflow-y-auto bg-[#070910] p-4 sm:p-8">
          {/* Student Watermark Overlay */}
          <div
            data-testid="pdf-watermark"
            className="pointer-events-none sticky top-2 z-20 mx-auto mb-3 flex w-fit flex-wrap items-center gap-3 rounded-full border border-cyber-pink/35 bg-obsidian/75 px-4 py-1 text-[11px] font-extrabold text-pink-200/85 backdrop-blur-sm"
          >
            <span>مرخص للطالب: {studentName}</span>
            <span dir="ltr" className="code-ltr text-cyan-200/85">
              {studentPhone}
            </span>
          </div>

          {activePage ? (
            <article
              style={{ fontSize: `${zoom}%` }}
              className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-obsidian-elevated p-6 shadow-glass sm:p-8"
            >
              {/* Subtle diagonal watermark stamp inside page */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.06]"
              >
                <p className="-rotate-12 whitespace-nowrap text-2xl font-black text-cyber-cyan sm:text-3xl">
                  {studentName} · {studentPhone}
                </p>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-extrabold text-cyan-200 sm:text-lg">
                    {activePage.headingAr}
                  </h3>
                  <span className="tabular-nums-ltr font-mono text-xs text-slate-muted">
                    ص {activePage.pageNumber} / {pages.length}
                  </span>
                </div>

                {activePage.paragraphsAr.map((para, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-loose text-chalk/95"
                  >
                    {para}
                  </p>
                ))}

                {activePage.codeSample ? (
                  <pre
                    dir="ltr"
                    className="code-ltr overflow-x-auto rounded-xl border border-cyber-cyan/30 bg-[#06070B] p-4 text-xs leading-6 text-cyan-200"
                  >
                    <code>{activePage.codeSample}</code>
                  </pre>
                ) : null}
              </div>
            </article>
          ) : (
            <p className="text-center text-xs text-slate-muted">
              لا توجد صفحات متاحة في هذه الملزمة.
            </p>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-obsidian/90 px-4 py-3">
          <CyberButton
            variant="ghost"
            size="sm"
            disabled={pageIndex <= 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
            الصفحة السابقة
          </CyberButton>

          <span className="tabular-nums-ltr font-mono text-xs font-bold text-slate-muted">
            {pageIndex + 1} / {Math.max(1, pages.length)}
          </span>

          <CyberButton
            variant="cyan"
            size="sm"
            disabled={pageIndex + 1 >= pages.length}
            onClick={() =>
              setPageIndex((p) => Math.min(pages.length - 1, p + 1))
            }
          >
            الصفحة التالية
            <ChevronLeft className="h-4 w-4" />
          </CyberButton>
        </div>
      </div>
    </div>
  );
}
