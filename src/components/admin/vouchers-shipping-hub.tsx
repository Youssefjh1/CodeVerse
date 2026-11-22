"use client";

import {
  Check,
  Copy,
  Package,
  PlusCircle,
  Power,
  Ticket,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type {
  AdminCommerceBootstrapData,
  OrderRecord,
  OrderStatus,
  VoucherAppliesTo,
  VoucherDiscountType,
  VoucherRecord,
} from "@/types/commerce";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  paid: "مدفوع",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  refunded: "مسترجع",
};

interface VouchersShippingHubProps {
  initialData: AdminCommerceBootstrapData;
}

export function VouchersShippingHub({ initialData }: VouchersShippingHubProps) {
  const [activeTab, setActiveTab] = useState<"vouchers" | "shipping">("vouchers");
  const [vouchers, setVouchers] = useState<VoucherRecord[]>(initialData.vouchers);
  const [orders, setOrders] = useState<OrderRecord[]>(initialData.orders);

  // Batch generator state
  const [batchCount, setBatchCount] = useState(5);
  const [prefix, setPrefix] = useState("CODE");
  const [discountType, setDiscountType] =
    useState<VoucherDiscountType>("full_unlock");
  const [discountValue, setDiscountValue] = useState(20);
  const [appliesTo, setAppliesTo] = useState<VoucherAppliesTo>("package");
  const [targetId, setTargetId] = useState<number>(
    initialData.targets.packages[2]?.id ?? initialData.targets.packages[0]?.id ?? 1,
  );
  const [maxUses, setMaxUses] = useState(1);
  const [channelNoteAr, setChannelNoteAr] = useState(
    "إنستاباي / فودافون كاش / سنتر",
  );
  const [generating, setGenerating] = useState(false);
  const [recentBatch, setRecentBatch] = useState<VoucherRecord[]>([]);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Shipping filter state
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const targetOptions =
    appliesTo === "course"
      ? initialData.targets.courses
      : appliesTo === "product"
        ? initialData.targets.products
        : appliesTo === "package"
          ? initialData.targets.packages
          : [];

  const handleAppliesToChange = (next: VoucherAppliesTo) => {
    setAppliesTo(next);
    if (next === "course") {
      setTargetId(initialData.targets.courses[0]?.id ?? 1);
    } else if (next === "product") {
      setTargetId(initialData.targets.products[0]?.id ?? 1);
    } else if (next === "package") {
      setTargetId(initialData.targets.packages[0]?.id ?? 1);
    }
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setVoucherError(null);
    setCopiedBatch(false);

    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchCount,
          prefix,
          discountType,
          discountValue,
          appliesTo,
          targetId: appliesTo === "all" ? null : targetId,
          maxUses,
          channelNoteAr,
        }),
      });

      const data = (await response.json()) as {
        vouchers?: VoucherRecord[];
        error?: string;
      };
      if (!response.ok || !data.vouchers) {
        setVoucherError(data.error ?? "تعذر توليد الأكواد.");
        return;
      }

      setRecentBatch(data.vouchers);
      setVouchers((prev) => [...data.vouchers!, ...prev]);
    } catch {
      setVoucherError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyBatch = async () => {
    try {
      await navigator.clipboard.writeText(
        recentBatch.map((v) => v.code).join("\n"),
      );
      setCopiedBatch(true);
      window.setTimeout(() => setCopiedBatch(false), 1800);
    } catch {
      setCopiedBatch(false);
    }
  };

  const handleToggleVoucher = async (voucher: VoucherRecord) => {
    const res = await fetch("/api/admin/vouchers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voucherId: voucher.id,
        isActive: !voucher.isActive,
      }),
    });
    const data = (await res.json()) as { voucher?: VoucherRecord };
    if (res.ok && data.voucher) {
      setVouchers((prev) =>
        prev.map((item) => (item.id === voucher.id ? data.voucher! : item)),
      );
    }
  };

  const handleOrderStatusChange = async (
    orderId: number,
    nextStatus: OrderStatus,
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      const data = (await res.json()) as { order?: OrderRecord };
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((item) => (item.id === orderId ? data.order! : item)),
        );
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const visibleOrders = orders.filter(
    (order) => statusFilter === "all" || order.status === statusFilter,
  );
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shippedCount = orders.filter(
    (o) => o.status === "shipped" || o.status === "delivered",
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-amber-400/15 px-3 py-1 text-xs font-extrabold text-amber-200">
            <Ticket className="h-3.5 w-3.5 text-amber-300" />
            إدارة الأكواد والشحن
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            مولّد أكواد التفعيل ولوحة شحن الكتب
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            أصدر دفعات أكواد للسناتر وإنستاباي وفودافون كاش وتابع شحن الكتب المطبوعة في المحافظات.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="تبويبات الأكواد والشحن"
          className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-obsidian p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vouchers"}
            onClick={() => setActiveTab("vouchers")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition",
              activeTab === "vouchers"
                ? "bg-cyber-cyan/20 text-cyan-100"
                : "text-slate-muted hover:text-chalk",
            )}
          >
            <Ticket className="h-3.5 w-3.5" />
            مولّد الأكواد ({vouchers.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "shipping"}
            onClick={() => setActiveTab("shipping")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition",
              activeTab === "shipping"
                ? "bg-cyber-purple/25 text-purple-100"
                : "text-slate-muted hover:text-chalk",
            )}
          >
            <Truck className="h-3.5 w-3.5" />
            لوحة شحن الكتب ({orders.length})
          </button>
        </div>
      </header>

      {activeTab === "vouchers" ? (
        <div className="space-y-6">
          <GlassCard variant="hero" className="p-5 sm:p-6">
            <form
              onSubmit={(e) => void handleGenerateBatch(e)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-xs font-bold text-slate-muted">
                  عدد الأكواد بالدفعة
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-muted">
                  بادئة الكود
                  <input
                    type="text"
                    dir="ltr"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    className="code-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-cyan-200"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-muted">
                  نوع الكود
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as VoucherDiscountType)
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  >
                    <option value="full_unlock">فتح كامل (Full Unlock)</option>
                    <option value="percent">نسبة خصم (%)</option>
                    <option value="fixed_egp">خصم ثابت (جنيه)</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-muted">
                  أقصى استخدامات للكود
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold text-slate-muted">
                  يرتبط بـ
                  <select
                    value={appliesTo}
                    onChange={(e) =>
                      handleAppliesToChange(e.target.value as VoucherAppliesTo)
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  >
                    <option value="package">باقة اشتراك</option>
                    <option value="course">كورس محدد</option>
                    <option value="product">ملزمة أو كتاب</option>
                    <option value="all">جميع عناصر المنصة</option>
                  </select>
                </label>

                {appliesTo !== "all" ? (
                  <label className="block text-xs font-bold text-slate-muted">
                    العنصر المستهدف
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                    >
                      {targetOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.titleAr}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="block text-xs font-bold text-slate-muted">
                    قيمة الخصم
                    <input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="tabular-nums-ltr mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 font-mono text-xs text-chalk"
                    />
                  </label>
                )}

                <label className="block text-xs font-bold text-slate-muted">
                  قناة الدفع / السنتر
                  <input
                    type="text"
                    value={channelNoteAr}
                    onChange={(e) => setChannelNoteAr(e.target.value)}
                    placeholder="إنستاباي / فودافون كاش / سنتر"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk"
                  />
                </label>
              </div>

              {voucherError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-500/45 bg-rose-500/15 p-3 text-xs text-rose-200"
                >
                  {voucherError}
                </p>
              ) : null}

              <div className="flex justify-end">
                <CyberButton type="submit" variant="primary" disabled={generating}>
                  <PlusCircle className="h-4 w-4" />
                  {generating ? "جاري التوليد..." : "توليد دفعة الأكواد الآن"}
                </CyberButton>
              </div>
            </form>
          </GlassCard>

          {recentBatch.length > 0 ? (
            <GlassCard
              data-testid="generated-voucher-batch"
              className="border-cyber-cyan/45 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <h2 className="text-sm font-extrabold text-cyan-200">
                  تم توليد {recentBatch.length} كود جديد بنجاح
                </h2>
                <button
                  type="button"
                  onClick={() => void handleCopyBatch()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-chalk hover:border-cyber-cyan/50"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-cyber-cyan" />
                      نسخ جميع الأكواد
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {recentBatch.map((v) => (
                  <div
                    key={v.id}
                    dir="ltr"
                    className="code-ltr rounded-xl border border-cyber-cyan/35 bg-[#06070B] px-3 py-2 text-center text-xs font-extrabold text-cyan-200"
                  >
                    {v.code}
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}

          <GlassCard className="p-5">
            <h2 className="mb-3 text-base font-extrabold text-chalk">
              سجل الأكواد النشطة ({vouchers.length})
            </h2>
            <div className="space-y-2.5">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  data-testid={`voucher-row-${voucher.code}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian/80 px-4 py-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        className="code-ltr rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/15 px-2.5 py-0.5 font-extrabold text-cyan-100"
                      >
                        {voucher.code}
                      </span>
                      <span className="font-bold text-chalk">
                        {voucher.targetLabelAr}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-muted">
                      {voucher.channelNoteAr} · الاستخدام:{" "}
                      <span className="tabular-nums-ltr font-mono text-white">
                        {voucher.currentUses} / {voucher.maxUses}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleToggleVoucher(voucher)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold",
                      voucher.isActive
                        ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-muted",
                    )}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {voucher.isActive ? "نشط" : "معطّل"}
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Shipping KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <GlassCard className="p-4">
              <p className="text-xs text-slate-muted">إجمالي طلبات الكتب</p>
              <p className="tabular-nums-ltr mt-1 font-mono text-2xl font-extrabold text-white">
                {orders.length}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-slate-muted">بانتظار التجهيز والشحن</p>
              <p className="tabular-nums-ltr mt-1 font-mono text-2xl font-extrabold text-amber-300">
                {pendingCount}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs text-slate-muted">تم الشحن / التسليم</p>
              <p className="tabular-nums-ltr mt-1 font-mono text-2xl font-extrabold text-emerald-300">
                {shippedCount}
              </p>
            </GlassCard>
          </div>

          <GlassCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-cyber-purple" />
                <h2 className="text-base font-extrabold text-chalk">
                  طلبات شحن الكتب المطبوعة
                </h2>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {(
                  [
                    { id: "all", label: "الكل" },
                    { id: "pending", label: "قيد المراجعة" },
                    { id: "paid", label: "مدفوع" },
                    { id: "shipped", label: "تم الشحن" },
                    { id: "delivered", label: "تم التسليم" },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 font-bold transition",
                      statusFilter === pill.id
                        ? "border-cyber-cyan/60 bg-cyber-cyan/15 text-cyan-100"
                        : "border-white/10 bg-obsidian text-slate-muted hover:text-chalk",
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {visibleOrders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`admin-order-${order.id}`}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-obsidian/80 p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        className="code-ltr rounded-md border border-cyber-purple/40 bg-cyber-purple/15 px-2 py-0.5 font-bold text-purple-200"
                      >
                        {order.orderCode}
                      </span>
                      <span className="font-extrabold text-white">
                        {order.shippingName}
                      </span>
                      <span
                        dir="ltr"
                        className="code-ltr text-[11px] text-cyan-200"
                      >
                        {order.shippingPhone}
                      </span>
                    </div>

                    <p className="text-chalk/90">{order.itemsSummaryAr}</p>
                    <p className="text-[11px] text-slate-muted">
                      {order.shippingGovernorate} — {order.shippingAddress}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tabular-nums-ltr font-mono text-sm font-extrabold text-emerald-300">
                      {order.totalEgp} EGP
                    </span>

                    <select
                      aria-label={`تغيير حالة الطلب ${order.orderCode}`}
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(e) =>
                        void handleOrderStatusChange(
                          order.id,
                          e.target.value as OrderStatus,
                        )
                      }
                      className="rounded-xl border border-white/15 bg-[#06070B] px-3 py-1.5 text-xs font-bold text-chalk"
                    >
                      {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                        (st) => (
                          <option key={st} value={st}>
                            {ORDER_STATUS_LABELS[st]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
