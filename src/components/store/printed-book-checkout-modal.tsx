"use client";

import { CheckCircle2, PackageCheck, Truck, X } from "lucide-react";
import { useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { EGYPT_GOVERNORATES } from "@/lib/commerce/vouchers";
import type { OrderRecord, PaymentMethod, StoreProduct } from "@/types/commerce";

interface PrintedBookCheckoutModalProps {
  product: StoreProduct | null;
  defaultName: string;
  defaultPhone: string;
  showDemoHints?: boolean;
  onClose: () => void;
  onOrderCreated: (order: OrderRecord) => void;
}

export function PrintedBookCheckoutModal({
  product,
  defaultName,
  defaultPhone,
  showDemoHints = false,
  onClose,
  onOrderCreated,
}: PrintedBookCheckoutModalProps) {
  const [shippingName, setShippingName] = useState(defaultName);
  const [shippingPhone, setShippingPhone] = useState(defaultPhone);
  const [shippingGovernorate, setShippingGovernorate] = useState("القاهرة");
  const [shippingAddress, setShippingAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [voucherCode, setVoucherCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!product) return null;

  const estimatedSubtotal = product.priceEgp * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          shippingName,
          shippingPhone,
          shippingGovernorate,
          shippingAddress,
          paymentMethod,
          voucherCode: voucherCode.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        order?: OrderRecord;
        error?: string;
      };
      if (!response.ok || !data.order) {
        setErrorMessage(data.error ?? "تعذر تسجيل طلب الشحن.");
        return;
      }

      setConfirmedOrder(data.order);
      onOrderCreated(data.order);
    } catch {
      setErrorMessage("حدث خطأ في الاتصال بالخادم.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`طلب شحن — ${product.titleAr}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyber-purple/45 bg-obsidian-elevated p-5 shadow-neon-purple sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyber-purple/45 bg-cyber-purple/15 text-cyber-purple">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-white">
                طلب شحن كتاب مطبوع
              </h2>
              <p className="text-[11px] text-slate-muted">{product.titleAr}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="إغلاق نافذة طلب الكتاب"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirmedOrder ? (
          <div data-testid="order-confirmation" className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/45 bg-emerald-500/15 text-emerald-300">
              <PackageCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                تم تسجيل طلب الشحن بنجاح!
              </h3>
              <p className="mt-1 text-xs text-slate-muted">
                رقم الطلب:{" "}
                <span dir="ltr" className="code-ltr font-bold text-cyan-200">
                  {confirmedOrder.orderCode}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-obsidian/80 p-4 text-right text-xs space-y-1.5">
              <p>
                <span className="text-slate-muted">المستلم: </span>
                <span className="font-bold text-chalk">
                  {confirmedOrder.shippingName}
                </span>
              </p>
              <p>
                <span className="text-slate-muted">المحافظة والعنوان: </span>
                <span className="font-bold text-chalk">
                  {confirmedOrder.shippingGovernorate} —{" "}
                  {confirmedOrder.shippingAddress}
                </span>
              </p>
              <p>
                <span className="text-slate-muted">الإجمالي المستحق: </span>
                <span className="tabular-nums-ltr font-mono font-extrabold text-emerald-300">
                  {confirmedOrder.totalEgp} EGP
                </span>
              </p>
            </div>

            <CyberButton variant="cyan" className="w-full" onClick={onClose}>
              <CheckCircle2 className="h-4 w-4" />
              تم
            </CyberButton>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-muted">
                الاسم الكامل
                <input
                  type="text"
                  required
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="الاسم ثلاثي"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                />
              </label>

              <label className="block text-xs font-bold text-slate-muted">
                رقم الموبايل (11 رقم)
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="01012345678"
                  className="code-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-muted">
                المحافظة
                <select
                  value={shippingGovernorate}
                  onChange={(e) => setShippingGovernorate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold text-slate-muted">
                الكمية
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-slate-muted">
              العنوان التفصيلي
              <textarea
                rows={2}
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="الحي / الشارع / رقم العمارة والشقة / أقرب علامة مميزة"
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-muted">
                طريقة الدفع
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                >
                  <option value="cod">الدفع عند الاستلام (COD)</option>
                  <option value="fawry">فوري (Fawry)</option>
                  <option value="paymob">بطاقة / محفظة (Paymob)</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-slate-muted">
                كود خصم (اختياري)
                <input
                  type="text"
                  dir="ltr"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder={showDemoHints ? "CODEVERSE20" : "أدخل كود الخصم"}
                  className="code-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-cyan-200"
                />
              </label>
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-xs text-slate-muted">
                السعر المبدئي:{" "}
                <strong className="tabular-nums-ltr font-mono text-white">
                  {estimatedSubtotal} EGP
                </strong>
              </span>
              <CyberButton type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? "جاري التأكيد..." : "تأكيد طلب الشحن"}
              </CyberButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
