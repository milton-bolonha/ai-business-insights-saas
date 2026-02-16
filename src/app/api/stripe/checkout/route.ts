import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { auditLog } from "@/lib/audit/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// Runtime: Node.js (required for audit logging)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json().catch(() => ({}));

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Unauthorized: User must be logged in to upgrade." },
        { status: 401 }
      );
    }
    const requestUserId = userId.trim();

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID is not configured" },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      `${appUrl}/create-account?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL || `${appUrl}/create-account?canceled=true`;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: requestUserId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: requestUserId,
        plan: "member",
        priceId,
      },
    });

    await auditLog("payment_checkout", "Payment checkout initiated", {
      userId: requestUserId,
      userRole: "member",
      details: {
        sessionId: checkoutSession.id,
        amount: checkoutSession.amount_total || 0,
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
