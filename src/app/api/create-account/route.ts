import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";

import { db } from "@/lib/db/mongodb";
import { auditLog } from "@/lib/audit/logger";
import { getPlanForUser } from "@/lib/saas/usage-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

type PlanId = "guest" | "member" | "business";

interface UserDocument {
  userId: string;
  clerkId?: string;
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

    // 1. Determine the effective User ID
    // Check if user is legally signed in via Clerk
    const { userId: clerkUserId } = await getAuth();

    // The userId from Stripe metadata (might be a guest ID like 'guest_...')
    const stripeUserId = session.client_reference_id || session.metadata?.userId;

    // Use Clerk ID if available (Account Linking), otherwise fallback to Stripe ID
    let targetUserId = clerkUserId || stripeUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing userId in checkout session" },
        { status: 400 }
      );
    }

    console.log(`[create-account] Processing for TargetUser: ${targetUserId} (Clerk: ${clerkUserId}, Stripe: ${stripeUserId})`);

    const plan = resolvePlanFromSession(session);

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    const email = session.customer_details?.email || session.customer_email;

    // 2. Update or Create User
    try {
      await db.updateOne<UserDocument>(
        "users",
        { userId: targetUserId },
        {
          $set: {
            isMember: true,
            stripeCustomerId,
            subscriptionId,
            plan,
            email,
            membershipStartedAt: new Date(),
            updatedAt: new Date(),
            migrationNeeded: true,
            // If we have a Clerk ID, ensure it's saved
            ...(clerkUserId ? { clerkId: clerkUserId } : {})
          },
          $setOnInsert: {
            userId: targetUserId,
            clerkId: clerkUserId || targetUserId,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (error: any) {
      if (error.code === 11000 && email) {
        console.log(`[create-account] Duplicate email ${email} found. Merging membership to existing user.`);

        // Find the user by email to get their REAL ID
        const existingUser = await db.findOne<UserDocument>("users", { email });
        if (existingUser) {
          console.log(`[create-account] Found existing user ${existingUser.userId}. Linking purchase to them.`);
          targetUserId = existingUser.userId; // Update target for Purchase record

          await db.updateOne<UserDocument>(
            "users",
            { email },
            {
              $set: {
                isMember: true,
                stripeCustomerId,
                subscriptionId,
                plan,
                membershipStartedAt: new Date(),
                updatedAt: new Date(),
                migrationNeeded: true,
                // If we are currently signed in as Clerk User, link this old account to us? 
                // Complex case, but at least update the subscription.
              }
            }
          );
        }
      } else {
        throw error;
      }
    }

    // 3. Record Purchase
    try {
      await db.insertOne("purchases", {
        userId: targetUserId,
        stripeSessionId: sessionId,
        stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        plan,
        status: session.payment_status,
        createdAt: new Date()
      });
      console.log(`[create-account] Purchase recorded for ${targetUserId}`);
    } catch (err) {
      console.error("Failed to record purchase", err);
      // Don't fail the request just because purchase log failed
    }

    await auditLog(
      "payment_success",
      "Membership confirmed via create-account",
      {
        userId: targetUserId,
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

    const planInfo = await getPlanForUser(targetUserId);

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
    // return detailed error in dev
    return NextResponse.json(
      { error: `Failed to confirm membership: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
