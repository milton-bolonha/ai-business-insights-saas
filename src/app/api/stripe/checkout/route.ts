import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getAuth } from "@/lib/auth/get-auth";
import { auditLog } from "@/lib/audit/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// Runtime: Node.js (required for audit logging)
export const runtime = "nodejs";

const checkoutRequestSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsedBody = checkoutRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid checkout payload",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { userId: requestUserId } = parsedBody.data;
    const { userId } = await getAuth();

    // Security: Only allow checkout for authenticated users
    if (!userId || userId !== requestUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID is not configured" },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?canceled=true`,
      metadata: {
        userId,
        plan: "member",
        priceId,
      },
    });

    // Audit log
    await auditLog("payment_checkout", "Payment checkout initiated", {
      userId,
      userRole: "member",
      details: {
        sessionId: checkoutSession.id,
        amount: 9900,
      },
      success: true,
      request,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
