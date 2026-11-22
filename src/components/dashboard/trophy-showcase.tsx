import { Award, Bug, Cpu, Flame, Shield, Terminal, Zap } from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { BadgeItem, BadgeRarity, RankProgress } from "@/types/gamification";

interface TrophyShowcaseProps {
  badges: BadgeItem[];
  totalEarned: number;
  rank: RankProgress;
  xp: number;
}

const BADGE_ICON_MAP: Record<BadgeItem["iconName"], typeof Terminal> = {
  Terminal,
  Flame,
  Bug,
  Cpu,
  Shield,
  Zap,
};

const RARITY_STYLES: Record<BadgeRarity, { labelAr: string; pillClass: string }> = {
  common: {
    labelAr: "عادي",
    pillClass: "border-slate-400/35 bg-slate-400/10 text-slate-200",
  },
  rare: {
    labelAr: "نادر",
    pillClass: "border-cyber-cyan/45 bg-cyber-cyan/15 text-cyan-200",
  },
  epic: {
    labelAr: "ملحمي",
    pillClass: "border-cyber-purple/50 bg-cyber-purple/20 text-purple-200",
  },
  legendary: {
    labelAr: "أسطوري",
    pillClass: "border-amber-400/50 bg-amber-400/15 text-amber-200",
  },
};

export function TrophyShowcase({
  badges,
  totalEarned,
  rank,
  xp,
}: TrophyShowcaseProps) {
  return (
    <GlassCard className="flex h-full flex-col justify-between p-5 sm:p-6">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-chalk">
            <Award className="h-5 w-5 text-cyber-purple" />
            خزانة الأوسمة
          </h2>
          <span className="tabular-nums-ltr rounded-full border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-200">
            {totalEarned} وسام
          </span>
        </div>

        {badges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
            <p className="text-sm font-bold text-chalk">
              لسه ما جمعتش أوسمة لحد دلوقتي
            </p>
            <p className="mt-1 text-xs text-slate-muted">
              حل أول تحدي في الساحة أو كمل أول درس وهتاخد أول وسام وXP فوري.
            </p>
            <div className="mt-4">
              <CyberButton href="/arena" variant="cyan" size="sm">
                ابدأ أول تحدي
              </CyberButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {badges.slice(0, 3).map((badge) => {
              const Icon = BADGE_ICON_MAP[badge.iconName] ?? Award;
              const rarityStyle = RARITY_STYLES[badge.rarity];

              return (
                <div
                  key={badge.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-obsidian/70 p-3 transition hover:border-cyber-purple/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyber-purple/40 bg-cyber-purple/15 text-cyber-cyan">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-chalk">{badge.titleAr}</h3>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          rarityStyle.pillClass,
                        )}
                      >
                        {rarityStyle.labelAr}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-muted">
                      {badge.descriptionAr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Rank Milestone */}
      <div className="mt-4 rounded-2xl border border-cyber-cyan/25 bg-cyber-cyan/5 p-3.5 text-xs">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-bold text-cyan-200">
            {rank.next ? `الهدف الجاي: ${rank.next.titleAr}` : "أعلى رتبة مكتملة"}
          </span>
          <span className="tabular-nums-ltr font-mono font-bold text-chalk">
            {rank.progressPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-cyber-cyan to-cyber-purple"
            style={{ width: `${rank.progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-muted">
          {rank.next
            ? `رصيدك الحالي ${xp.toLocaleString("en-US")} XP ومحتاج ${rank.xpToNext.toLocaleString("en-US")} XP للترقية.`
            : "إنت دلوقتي في قمة ترتيب CodeVerse."}
        </p>
      </div>
    </GlassCard>
  );
}
