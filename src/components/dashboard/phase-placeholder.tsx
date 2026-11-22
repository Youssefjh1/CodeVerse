import { CheckCircle2, Clock3 } from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface PhasePlaceholderProps {
  phaseLabel: string;
  titleAr: string;
  descriptionAr: string;
  accent?: "purple" | "cyan" | "pink";
  upcomingFeatures: string[];
  codeSample?: string;
}

const ACCENT_PILL = {
  purple: "border-cyber-purple/45 bg-cyber-purple/15 text-purple-200",
  cyan: "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
  pink: "border-cyber-pink/45 bg-cyber-pink/15 text-pink-200",
} as const;

export function PhasePlaceholder({
  phaseLabel,
  titleAr,
  descriptionAr,
  accent = "cyan",
  upcomingFeatures,
  codeSample,
}: PhasePlaceholderProps) {
  return (
    <GlassCard variant="hero" className="p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold",
            ACCENT_PILL[accent],
          )}
        >
          <Clock3 className="h-3.5 w-3.5" />
          {phaseLabel}
        </span>
        <CyberButton href="/dashboard" variant="ghost" size="sm">
          الرجوع للوحة اللاعب
        </CyberButton>
      </div>

      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{titleAr}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-muted">
        {descriptionAr}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-obsidian/70 p-5 lg:col-span-7">
          <h2 className="text-sm font-extrabold text-chalk">
            المميزات الجاهزة للتركيب في هذه المرحلة
          </h2>
          <ul className="space-y-2.5">
            {upcomingFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-slate-muted"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyber-cyan" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {codeSample ? (
          <div className="rounded-2xl border border-cyber-cyan/25 bg-obsidian/90 p-5 lg:col-span-5">
            <p className="mb-3 text-xs font-bold text-cyan-200">
              معاينة البنية التقنية
            </p>
            <pre
              dir="ltr"
              className="code-ltr overflow-x-auto text-xs leading-6 text-purple-200"
            >
              <code>{codeSample}</code>
            </pre>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
