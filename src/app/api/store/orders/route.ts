import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  createPrintedBookOrder,
  revalidatePhase4Paths,
} from "@/lib/data/phase4-store";
import {
  applyRateLimitHeaders,
  checkDualRateLimit,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";
import type { PaymentMethod } from "@/types/commerce";

const VALID_METHODS = new Set<PaymentMethod>(["cod", "fawry", "paymob", "voucher"]);

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  const rateLimit = checkDualRateLimit({
    namespace: "store-order",
    userId: session.userId,
    request,
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      `تم إرسال طلبات كثيرة خلال دقيقة واحدة. انتظر ${rateLimit.retryAfterSeconds} ثانية ثم أعد المحاولة.`,
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const productId = Number(body.productId);
    const quantity = Number(body.quantity ?? 1);
    const shippingName = String(body.shippingName ?? "").trim();
    const shippingPhone = String(body.shippingPhone ?? "").trim();
    const shippingGovernorate = String(body.shippingGovernorate ?? "").trim();
    const shippingAddress = String(body.shippingAddress ?? "").trim();
    const rawMethod = String(body.paymentMethod ?? "cod") as PaymentMethod;
    const paymentMethod = VALID_METHODS.has(rawMethod) ? rawMethod : "cod";
    const voucherCode =
      typeof body.voucherCode === "string" ? body.voucherCode : undefined;

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "اختر الكتاب المطلوب." }, { status: 400 });
    }
    if (shippingName.length < 3) {
      return NextResponse.json(
        { error: "اكتب الاسم ثلاثياً لاستلام الشحنة." },
        { status: 400 },
      );
    }
    if (!/^01[0-9]{9}$/.test(shippingPhone)) {
      return NextResponse.json(
        { error: "اكتب رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ 01." },
        { status: 400 },
      );
    }
    if (!shippingGovernorate) {
      return NextResponse.json(
        { error: "اختر المحافظة للتوصيل." },
        { status: 400 },
      );
    }
    if (shippingAddress.length < 8) {
      return NextResponse.json(
        { error: "اكتب العنوان التفصيلي بوضوح (الشارع، المبنى، علامة مميزة)." },
        { status: 400 },
      );
    }

    const order = await createPrintedBookOrder(session, {
      productId,
      quantity,
      shippingName,
      shippingPhone,
      shippingGovernorate,
      shippingAddress,
      paymentMethod,
      voucherCode,
    });

    revalidatePhase4Paths();
    return applyRateLimitHeaders(
      NextResponse.json({ order }, { status: 201 }),
      rateLimit,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "تعذر تسجيل طلب الشحن.";
    return applyRateLimitHeaders(
      NextResponse.json({ error: message }, { status: 400 }),
      rateLimit,
    );
  }
}
