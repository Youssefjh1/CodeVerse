import { createHmac, timingSafeEqual } from "node:crypto";

export interface PaymobCheckoutResult {
  provider: "paymob";
  mode: "live" | "stub";
  reference: string;
  iframeUrl: string;
  amountCents: number;
  currency: "EGP";
  messageAr: string;
}

export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_API_KEY?.trim() &&
      process.env.PAYMOB_INTEGRATION_ID?.trim() &&
      process.env.PAYMOB_IFRAME_ID?.trim(),
  );
}

export function createPaymobCheckoutSession(params: {
  orderCode: string;
  amountEgp: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): PaymobCheckoutResult {
  const amountCents = Math.max(0, Math.round(params.amountEgp * 100));
  const iframeId = process.env.PAYMOB_IFRAME_ID?.trim() || "demo-iframe";
  const reference = `PM-${params.orderCode}`;

  if (!isPaymobConfigured()) {
    return {
      provider: "paymob",
      mode: "stub",
      reference,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=stub_${reference}`,
      amountCents,
      currency: "EGP",
      messageAr:
        "تم تجهيز جلسة Paymob التجريبية (Stub) — فعّل متغيرات PAYMOB_* لإطلاق الدفع الفعلي بالبطاقات والمحافظ.",
    };
  }

  return {
    provider: "paymob",
    mode: "live",
    reference,
    iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?merchant_order_id=${encodeURIComponent(params.orderCode)}`,
    amountCents,
    currency: "EGP",
    messageAr: "تم تجهيز رابط الدفع عبر بوابة Paymob.",
  };
}

const PAYMOB_HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data_pan",
  "source_data_sub_type",
  "source_data_type",
  "success",
] as const;

export function verifyPaymobHmacSignature(
  obj: Record<string, unknown>,
  receivedHmac: string,
  secret: string,
): boolean {
  if (!secret || !receivedHmac) {
    return false;
  }

  const orderVal =
    obj.order && typeof obj.order === "object"
      ? String((obj.order as Record<string, unknown>).id ?? "")
      : String(obj.order ?? "");

  const sourceData =
    obj.source_data && typeof obj.source_data === "object"
      ? (obj.source_data as Record<string, unknown>)
      : {};

  const flattened: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, String(v ?? "")]),
    ),
    order: orderVal,
    source_data_pan: String(sourceData.pan ?? obj.source_data_pan ?? ""),
    source_data_sub_type: String(
      sourceData.sub_type ?? obj.source_data_sub_type ?? "",
    ),
    source_data_type: String(sourceData.type ?? obj.source_data_type ?? ""),
  };

  const concatenated = PAYMOB_HMAC_FIELDS.map(
    (field) => flattened[field] ?? "",
  ).join("");

  const computed = createHmac("sha512", secret)
    .update(concatenated)
    .digest("hex");

  const a = Buffer.from(computed.toLowerCase(), "utf8");
  const b = Buffer.from(receivedHmac.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
