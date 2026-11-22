import { createHash, timingSafeEqual } from "node:crypto";

export interface FawryChargeResult {
  provider: "fawry";
  mode: "live" | "stub";
  referenceNumber: string;
  merchantRefNum: string;
  amountEgp: number;
  expiresAt: string;
  messageAr: string;
}

export function isFawryConfigured(): boolean {
  return Boolean(
    process.env.FAWRY_MERCHANT_CODE?.trim() &&
      process.env.FAWRY_SECURITY_KEY?.trim(),
  );
}

export function createFawryReferenceCharge(params: {
  orderCode: string;
  amountEgp: number;
  customerName: string;
  customerPhone: string;
}): FawryChargeResult {
  const digits = params.orderCode.replace(/\D/g, "").slice(-6).padStart(6, "4");
  const referenceNumber = `991${digits}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  if (!isFawryConfigured()) {
    return {
      provider: "fawry",
      mode: "stub",
      referenceNumber,
      merchantRefNum: params.orderCode,
      amountEgp: params.amountEgp,
      expiresAt,
      messageAr:
        "تم إنشاء كود فوري التجريبي (Stub) — توجّه لأقرب ماكينة فوري بكود المرجع أو فعّل مفاتيح Fawry الإنتاجية.",
    };
  }

  return {
    provider: "fawry",
    mode: "live",
    referenceNumber,
    merchantRefNum: params.orderCode,
    amountEgp: params.amountEgp,
    expiresAt,
    messageAr: "تم إصدار رقم مرجعي للدفع عبر فوري بنجاح.",
  };
}

export function verifyFawryCallbackSignature(
  params: {
    fawryRefNumber: string;
    merchantRefNumber: string;
    paymentAmount: string;
    orderAmount: string;
    orderStatus: string;
    paymentMethod: string;
    messageSignature: string;
  },
  securityKey: string,
): boolean {
  if (!securityKey || !params.messageSignature) {
    return false;
  }

  const raw =
    params.fawryRefNumber +
    params.merchantRefNumber +
    params.paymentAmount +
    params.orderAmount +
    params.orderStatus +
    params.paymentMethod +
    securityKey;

  const computed = createHash("sha256").update(raw).digest("hex");
  const a = Buffer.from(computed.toLowerCase(), "utf8");
  const b = Buffer.from(params.messageSignature.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
