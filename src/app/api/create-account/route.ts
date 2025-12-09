import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db/mongodb";
import { auditLog } from "@/lib/audit/logger";
import { getPlanForUser } from "@/lib/saas/usage-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

type PlanId = "guest" | "member" | "business";

interface UserDocument {
  userId: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  plan?: PlanId;
  isMember?: boolean;
  migrationNeeded?: boolean;
}

function resolvePlanFromSession(
  session: Stripe.Checkout.Session
): "member" | "business" {
  const priceId =
    (session?.line_items as any)?.data?.[0]?.price?.id ||
    session?.metadata?.priceId;
  const memberPrice = process.env.STRIPE_PRICE_ID;

  if (priceId && memberPrice && priceId === memberPrice) return "member";

  const planMeta = session.metadata?.plan;
  if (planMeta === "business") return "business";
  return "member";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId =
      body.sessionId ||
      req.nextUrl.searchParams.get("session_id") ||
      req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isPaid =
      session.payment_status === "paid" || session.status === "complete";

    if (!isPaid) {
      return NextResponse.json(
        { error: "Session not paid", status: session.payment_status },
        { status: 402 }
      );
    }

    const userId = session.client_reference_id || session.metadata?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in checkout session" },
        { status: 400 }
      );
    }

    const plan = resolvePlanFromSession(session);

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    await db.updateOne<UserDocument>(
      "users",
      { userId },
      {
        $set: {
          isMember: true,
          stripeCustomerId,
          subscriptionId,
          plan,
          membershipStartedAt: new Date(),
          updatedAt: new Date(),
          migrationNeeded: true,
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    await auditLog(
      "payment_success",
      "Membership confirmed via create-account",
      {
        userId,
        userRole: "member",
        details: {
          sessionId,
          amount: session.amount_total,
          currency: session.currency,
          plan,
        },
        success: true,
      }
    );

    const planInfo = await getPlanForUser(userId);

    return NextResponse.json(
      {
        success: true,
        plan,
        limits: planInfo.limits,
        redirect: "/admin",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[create-account] Error confirming membership:", error);
    return NextResponse.json(
      { error: "Failed to confirm membership" },
      { status: 500 }
    );
  }
}
