import { NextResponse } from "next/server";
import {
  markOrderPaidByReference,
  revalidatePhase4Paths,
} from "@/lib/data/phase4-store";
import { verifyPaymobHmacSignature } from "@/lib/payments/paymob";
import { isDemoModeEnabled } from "@/lib/supabase/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      hmac?: string;
      obj?: Record<string, unknown>;
    };

    const payloadObj =
      body.obj && typeof body.obj === "object"
        ? body.obj
        : (body as Record<string, unknown>);
    const secret = process.env.PAYMOB_HMAC_SECRET?.trim();

    if (!secret) {
      if (!isDemoModeEnabled()) {
        return NextResponse.json(
          { error: "Paymob HMAC secret is not configured in production." },
          { status: 503 },
        );
      }
    } else {
      const receivedHmac =
        body.hmac ?? request.headers.get("x-paymob-hmac") ?? "";
      const valid = verifyPaymobHmacSignature(payloadObj, receivedHmac, secret);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid Paymob HMAC signature." },
          { status: 401 },
        );
      }
    }

    const orderMeta =
      payloadObj.order && typeof payloadObj.order === "object"
        ? (payloadObj.order as Record<string, unknown>)
        : {};
    const merchantOrderId = String(
      orderMeta.merchant_order_id ?? payloadObj.merchant_order_id ?? "",
    ).trim();
    const isSuccess = payloadObj.success === true || payloadObj.success === "true";

    let orderUpdated = false;
    if (isSuccess && merchantOrderId) {
      orderUpdated = await markOrderPaidByReference(merchantOrderId);
      if (orderUpdated) {
        revalidatePhase4Paths();
      }
    }

    return NextResponse.json({
      received: true,
      provider: "paymob",
      mode: secret ? "verified_hmac" : "stub",
      orderUpdated,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 },
    );
  }
}
