"use client";

import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { PackagesGrid } from "@/components/store/packages-grid";
import { PrintedBookCheckoutModal } from "@/components/store/printed-book-checkout-modal";
import { ProtectedPdfViewer } from "@/components/store/protected-pdf-viewer";
import { RedeemVoucherModal } from "@/components/store/redeem-voucher-modal";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import type {
  OrderRecord,
  StoreBootstrapData,
  StorePackage,
  StoreProduct,
} from "@/types/commerce";

interface StoreHubProps {
  initialData: StoreBootstrapData;
}

interface GatewayNotice {
  provider: "paymob" | "fawry";
  mode: "live" | "stub";
  itemTitleAr: string;
  reference?: string;
  referenceNumber?: string;
  messageAr: string;
}

export function StoreHub({ initialData }: StoreHubProps) {
  const [products, setProducts] = useState<StoreProduct[]>(initialData.products);
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>(
    initialData.recentOrders,
  );
  const [activePdfProduct, setActivePdfProduct] = useState<StoreProduct | null>(
    null,
  );
  const [checkoutBookProduct, setCheckoutBookProduct] =
    useState<StoreProduct | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemHint, setRedeemHint] = useState<string | undefined>(undefined);
  const [busyPackageId, setBusyPackageId] = useState<number | null>(null);
  const [gatewayNotice, setGatewayNotice] = useState<GatewayNotice | null>(null);

  const pdfNotes = products.filter((p) => p.productType === "pdf_note");
  const printedBooks = products.filter((p) => p.productType === "printed_book");
  const isDemoMode = initialData.mode === "demo";

  const handleRedeemed = (payload: { unlockedProductIds: number[] }) => {
    if (payload.unlockedProductIds.length > 0) {
      const unlocked = new Set(payload.unlockedProductIds);
      setProducts((prev) =>
        prev.map((prod) =>
          unlocked.has(prod.id) ? { ...prod, isUnlocked: true } : prod,
        ),
      );
    }
  };

  const handleGatewayCheckout = async (
    pkg: StorePackage,
    provider: "paymob" | "fawry",
  ) => {
    setBusyPackageId(pkg.id);
    setGatewayNotice(null);
    try {
      const res = await fetch("/api/store/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "package",
          targetId: pkg.id,
          provider,
        }),
      });
      const data = (await res.json()) as GatewayNotice;
      if (res.ok) {
        setGatewayNotice(data);
      }
    } finally {
      setBusyPackageId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/45 bg-cyber-cyan/15 px-3 py-1 text-xs font-extrabold text-cyan-200">
            <ShoppingBag className="h-3.5 w-3.5 text-cyber-cyan" />
            متجر CodeVerse والمذكرات
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            الملازم المحمية، الكتب المطبوعة، والباقات
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            افتح ملازم PDF داخل قارئ المنصة بالعلامة المائية، أو اطلب كتابك المطبوع لباب البيت.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => {
            setRedeemHint(undefined);
            setRedeemOpen(true);
          }}
        >
          <KeyRound className="h-4 w-4" />
          تفعيل كود سنتر / خصم
        </CyberButton>
      </header>

      {gatewayNotice ? (
        <GlassCard
          data-testid="gateway-stub-notice"
          className="border-cyber-cyan/45 p-4 text-xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 font-extrabold text-cyan-200">
                <CreditCard className="h-4 w-4" />
                {gatewayNotice.provider === "paymob"
                  ? "جلسة Paymob جاهزة"
                  : "رقم مرجعي Fawry جاهز"}{" "}
                — {gatewayNotice.itemTitleAr}
              </p>
              <p className="text-chalk">{gatewayNotice.messageAr}</p>
              {gatewayNotice.referenceNumber ? (
                <p className="tabular-nums-ltr font-mono font-bold text-amber-300">
                  Fawry Ref: {gatewayNotice.referenceNumber}
                </p>
              ) : gatewayNotice.reference ? (
                <p className="tabular-nums-ltr font-mono font-bold text-purple-200">
                  Paymob Ref: {gatewayNotice.reference}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setGatewayNotice(null)}
              className="text-xs font-bold text-slate-muted hover:text-white"
            >
              إخفاء
            </button>
          </div>
        </GlassCard>
      ) : null}

      {/* Flexible Packages */}
      <PackagesGrid
        packages={initialData.packages}
        busyPackageId={busyPackageId}
        onRedeemClick={(pkg) => {
          setRedeemHint(
            isDemoMode
              ? `فعّل "${pkg.titleAr}" بكود السنتر أو إنستاباي (جرّب CODE-TERM-2026).`
              : `فعّل "${pkg.titleAr}" بكود السنتر أو إنستاباي.`,
          );
          setRedeemOpen(true);
        }}
        onGatewayCheckout={(pkg, provider) =>
          void handleGatewayCheckout(pkg, provider)
        }
      />

      {/* Digital PDF Notes */}
      <section aria-label="الملازم الرقمية المحمية" className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-chalk">
            الملازم الرقمية المحمية (PDF Viewer)
          </h2>
          <p className="text-xs text-slate-muted">
            تُعرض داخل المنصة بعلامة مائية تحمل اسمك ورقم موبايلك بدون زر تحميل مباشر
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pdfNotes.map((note) => (
            <GlassCard
              key={note.id}
              className="flex flex-col justify-between p-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/15 px-2.5 py-0.5 text-[11px] font-extrabold text-cyan-200">
                    <FileText className="h-3.5 w-3.5" />
                    ملزمة رقمية محمية
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-muted">
                    {note.grade === "all" ? "كل الصفوف" : GRADE_LABELS[note.grade]}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {note.titleAr}
                </h3>
                <p className="text-xs leading-relaxed text-slate-muted">
                  {note.descriptionAr}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                <span className="tabular-nums-ltr font-mono text-sm font-extrabold text-chalk">
                  {note.isUnlocked ? "مفتوحة على حسابك" : `${note.priceEgp} EGP`}
                </span>

                {note.isUnlocked ? (
                  <CyberButton
                    variant="cyan"
                    size="sm"
                    onClick={() => setActivePdfProduct(note)}
                  >
                    <BookOpen className="h-4 w-4" />
                    فتح في القارئ المحمي
                  </CyberButton>
                ) : (
                  <CyberButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRedeemHint(
                        isDemoMode
                          ? `أدخل كود التفعيل لفتح "${note.titleAr}" داخل القارئ المحمي (جرّب CODE-TERM-2026).`
                          : `أدخل كود التفعيل لفتح "${note.titleAr}" داخل القارئ المحمي.`,
                      );
                      setRedeemOpen(true);
                    }}
                  >
                    <Lock className="h-4 w-4" />
                    فتح بكود التفعيل
                  </CyberButton>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Printed Books */}
      <section aria-label="الكتب المطبوعة للشحن" className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-chalk">
            الكتب المطبوعة (شحن لجميع المحافظات)
          </h2>
          <p className="text-xs text-slate-muted">
            {isDemoMode
              ? "اطلب نسختك الورقية الآن مع دعم كود الخصم CODEVERSE20 والدفع عند الاستلام أو فوري"
              : "اطلب نسختك الورقية الآن مع دعم أكواد الخصم والدفع عند الاستلام أو فوري"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {printedBooks.map((book) => (
            <GlassCard
              key={book.id}
              className="flex flex-col justify-between p-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-200">
                    <Truck className="h-3.5 w-3.5" />
                    كتاب مطبوع للشحن
                  </span>
                  <span className="tabular-nums-ltr font-mono text-[11px] text-emerald-300">
                    متوفر ({book.stockCount ?? 0})
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {book.titleAr}
                </h3>
                <p className="text-xs leading-relaxed text-slate-muted">
                  {book.descriptionAr}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                <span className="tabular-nums-ltr font-mono text-base font-extrabold text-white">
                  {book.priceEgp} EGP
                </span>
                <CyberButton
                  variant="primary"
                  size="sm"
                  onClick={() => setCheckoutBookProduct(book)}
                >
                  <Truck className="h-4 w-4" />
                  اطلب الكتاب للشحن
                </CyberButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Recent Student Book Orders */}
      {recentOrders.length > 0 ? (
        <GlassCard className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-chalk">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            طلبات الشحن الخاصة بك
          </h3>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-obsidian/80 px-4 py-2.5 text-xs"
              >
                <div>
                  <span dir="ltr" className="code-ltr font-bold text-cyan-200">
                    {order.orderCode}
                  </span>{" "}
                  · <span className="text-chalk">{order.itemsSummaryAr}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums-ltr font-mono font-bold text-white">
                    {order.totalEgp} EGP
                  </span>
                  <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <ProtectedPdfViewer
        product={activePdfProduct}
        studentName={initialData.studentName}
        studentPhone={initialData.studentPhone}
        onClose={() => setActivePdfProduct(null)}
      />

      <PrintedBookCheckoutModal
        product={checkoutBookProduct}
        defaultName={initialData.studentName}
        defaultPhone={initialData.studentPhone}
        showDemoHints={isDemoMode}
        onClose={() => setCheckoutBookProduct(null)}
        onOrderCreated={(order) =>
          setRecentOrders((prev) => [order, ...prev])
        }
      />

      <RedeemVoucherModal
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onRedeemed={handleRedeemed}
        initialHintAr={redeemHint}
        showDemoHints={isDemoMode}
      />
    </div>
  );
}
