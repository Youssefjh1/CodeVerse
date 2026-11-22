"use client";

import { BookMarked, Check, Copy } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import type { GeneratedCheatSheet } from "@/types/arena";

interface CheatSheetViewerProps {
  cheatSheet: GeneratedCheatSheet;
}

export function CheatSheetViewer({ cheatSheet }: CheatSheetViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines = [
      cheatSheet.titleAr,
      cheatSheet.summaryAr,
      "",
      ...cheatSheet.keyTerms.map((t) => `- ${t.term}: ${t.definitionAr}`),
      "",
      ...cheatSheet.sections.flatMap((s) => [
        `## ${s.headingAr}`,
        ...s.bulletsAr.map((b) => `* ${b}`),
        s.codeExample ? `\n${s.codeExample}\n` : "",
      ]),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <GlassCard data-testid="cheat-sheet-viewer" className="border-cyber-cyan/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyber-cyan/45 bg-cyber-cyan/15 text-cyber-cyan">
            <BookMarked className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {cheatSheet.titleAr}
            </h3>
            <p className="text-xs text-slate-muted">{cheatSheet.summaryAr}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-chalk transition hover:border-cyber-cyan/50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-300" />
              تم النسخ
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-cyber-cyan" />
              نسخ الملخص
            </>
          )}
        </button>
      </div>

      {cheatSheet.keyTerms.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {cheatSheet.keyTerms.map((term, idx) => (
            <div
              key={`${term.term}-${idx}`}
              className="rounded-xl border border-white/10 bg-obsidian/80 p-3"
            >
              <p className="text-xs font-extrabold text-cyan-200">{term.term}</p>
              <p className="mt-1 text-xs leading-relaxed text-chalk/90">
                {term.definitionAr}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {cheatSheet.sections.map((section, idx) => (
          <div
            key={`${section.headingAr}-${idx}`}
            className="rounded-xl border border-cyber-purple/25 bg-obsidian/70 p-4"
          >
            <h4 className="text-xs font-extrabold text-purple-200">
              {section.headingAr}
            </h4>
            <ul className="mt-2 list-disc space-y-1.5 pr-4 text-xs text-chalk/90">
              {section.bulletsAr.map((bullet, bIdx) => (
                <li key={bIdx}>{bullet}</li>
              ))}
            </ul>
            {section.codeExample ? (
              <pre
                dir="ltr"
                className="code-ltr mt-3 overflow-x-auto rounded-lg border border-white/10 bg-[#06070B] p-3 text-xs text-cyan-200"
              >
                <code>{section.codeExample}</code>
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
