"use client";

import { Check, CreditCard, KeyRound, Sparkles } from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { StorePackage } from "@/types/commerce";

interface PackagesGridProps {
  packages: StorePackage[];
  onRedeemClick: (pkg: StorePackage) => void;
  onGatewayCheckout: (pkg: StorePackage, provider: "paymob" | "fawry") => void;
  busyPackageId: number | null;
}

export function PackagesGrid({
  packages,
  onRedeemClick,
  onGatewayCheckout,
  busyPackageId,
}: PackagesGridProps) {
  return (
    <section aria-label="الباقات المرنة" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-chalk">
            الباقات المرنة للاشتراك
          </h2>
          <p className="text-xs text-slate-muted">
            اختر الباقة المناسبة ليك: حصة واحدة، اشتراك شهري، أو الترم الكامل بخصم كبير
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {packages.map((pkg) => {
          const isFeatured = pkg.tier === "monthly_bundle";
          const isUltimate = pkg.tier === "full_term_bundle";

          return (
            <GlassCard
              key={pkg.id}
              variant={isFeatured ? "hero" : "default"}
              className={cn(
                "flex flex-col justify-between p-5",
                isUltimate && "border-cyber-cyan/45",
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold",
                      isFeatured
                        ? "border-cyber-pink/50 bg-cyber-pink/20 text-pink-200"
                        : isUltimate
                          ? "border-cyber-cyan/50 bg-cyber-cyan/15 text-cyan-200"
                          : "border-white/15 bg-white/5 text-slate-muted",
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {pkg.badgeAr}
                  </span>

                  <span className="tabular-nums-ltr rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
                    وفّر {pkg.discountPercent}%
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {pkg.titleAr}
                </h3>
                <p className="text-xs leading-relaxed text-slate-muted">
                  {pkg.descriptionAr}
                </p>

                <div className="flex items-baseline gap-2.5 pt-1">
                  <span className="tabular-nums-ltr font-mono text-2xl font-extrabold text-white">
                    {pkg.priceEgp} EGP
                  </span>
                  <span className="tabular-nums-ltr font-mono text-xs text-slate-muted line-through">
                    {pkg.originalPriceEgp} EGP
                  </span>
                </div>

                <ul className="space-y-2 border-t border-white/10 pt-3 text-xs text-chalk/90">
                  {pkg.featuresAr.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyber-cyan" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                <CyberButton
                  variant={isFeatured ? "primary" : "cyan"}
                  size="sm"
                  className="w-full"
                  onClick={() => onRedeemClick(pkg)}
                >
                  <KeyRound className="h-4 w-4" />
                  تفعيل بكود سنتر / فودافون كاش
                </CyberButton>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busyPackageId === pkg.id}
                    onClick={() => onGatewayCheckout(pkg, "paymob")}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-chalk transition hover:border-cyber-purple/50 disabled:opacity-50"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-cyber-purple" />
                    Paymob
                  </button>
                  <button
                    type="button"
                    disabled={busyPackageId === pkg.id}
                    onClick={() => onGatewayCheckout(pkg, "fawry")}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-chalk transition hover:border-amber-400/50 disabled:opacity-50"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-amber-300" />
                    Fawry
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
