import { NextResponse } from "next/server";
import {
  markOrderPaidByReference,
  revalidatePhase4Paths,
} from "@/lib/data/phase4-store";
import { verifyFawryCallbackSignature } from "@/lib/payments/fawry";
import { isDemoModeEnabled } from "@/lib/supabase/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const securityKey = process.env.FAWRY_SECURITY_KEY?.trim();

    const fawryRefNumber = String(body.fawryRefNumber ?? "");
    const merchantRefNumber = String(body.merchantRefNumber ?? "");
    const paymentAmount = String(body.paymentAmount ?? "");
    const orderAmount = String(body.orderAmount ?? "");
    const orderStatus = String(body.orderStatus ?? "");
    const paymentMethod = String(body.paymentMethod ?? "");
    const messageSignature = String(body.messageSignature ?? "");

    if (!securityKey) {
      if (!isDemoModeEnabled()) {
        return NextResponse.json(
          { error: "Fawry security key is not configured in production." },
          { status: 503 },
        );
      }
    } else {
      const valid = verifyFawryCallbackSignature(
        {
          fawryRefNumber,
          merchantRefNumber,
          paymentAmount,
          orderAmount,
          orderStatus,
          paymentMethod,
          messageSignature,
        },
        securityKey,
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid Fawry callback signature." },
          { status: 401 },
        );
      }
    }

    let orderUpdated = false;
    if (orderStatus.toUpperCase() === "PAID" && (merchantRefNumber || fawryRefNumber)) {
      orderUpdated =
        (await markOrderPaidByReference(merchantRefNumber)) ||
        (await markOrderPaidByReference(fawryRefNumber));
      if (orderUpdated) {
        revalidatePhase4Paths();
      }
    }

    return NextResponse.json({
      received: true,
      provider: "fawry",
      mode: securityKey ? "verified_signature" : "stub",
      orderUpdated,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Fawry webhook payload." },
      { status: 400 },
    );
  }
}
