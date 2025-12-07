import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db/mongodb";
import { auditLog } from "@/lib/audit/logger";

// Runtime: Node.js (required for MongoDB)
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const MEMBER_PRICE_ID = process.env.STRIPE_PRICE_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown signature error";
      console.error("[Stripe Webhook] ❌ Signature verification failed:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[Stripe Webhook] 📨 Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface UserDocument {
  userId: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  plan?: "guest" | "member" | "business";
}

function resolvePlanFromSession(session: Stripe.Checkout.Session): "member" | "business" {
  const priceId =
    (session?.line_items as any)?.data?.[0]?.price?.id || session?.metadata?.priceId;
  if (priceId && MEMBER_PRICE_ID && priceId === MEMBER_PRICE_ID) {
    return "member";
  }
  const planMeta = session.metadata?.plan;
  if (planMeta === "business") return "business";
  return "member";
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): "member" | "business" {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (priceId && MEMBER_PRICE_ID && priceId === MEMBER_PRICE_ID) {
    return "member";
  }
  const planMeta = (subscription.metadata?.plan as string) || "";
  if (planMeta === "business") return "business";
  return "member";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  
  // Audit log
  await auditLog("payment_success", "Payment completed successfully", {
    userId: userId || null,
    userRole: userId ? "member" : null,
    details: {
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
    },
    success: true,
  });

  if (!userId) {
    console.error("[Stripe Webhook] ❌ No userId in checkout session");
    return;
  }

  const plan = resolvePlanFromSession(session);

  try {
    // Mark user as member in database
    // Note: session.customer and session.subscription can be string | null
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
          // Flag to indicate migration is needed (client will check this)
          migrationNeeded: true,
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`[Stripe Webhook] ✅ User ${userId} marked as member`);
    console.log(`[Stripe Webhook] 📝 Migration flag set - client should migrate localStorage data`);
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to update user membership:", error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    // Find user by customer ID
    const userDoc = await db.findOne<UserDocument>("users", { stripeCustomerId: customerId });

    if (!userDoc) {
      console.warn(`[Stripe Webhook] ⚠️ No user found for customer ${customerId}`);
      return;
    }

    const userId = userDoc.userId;
    const plan = resolvePlanFromSubscription(subscription);
    const isActive = subscription.status === "active";

    await db.updateOne<UserDocument>(
      "users",
      { userId },
      {
        $set: {
          isMember: isActive,
          subscriptionStatus: subscription.status,
          subscriptionId: subscription.id,
          plan,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[Stripe Webhook] ✅ User ${userId} subscription updated: ${subscription.status}`);
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to update subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const userDoc = await db.findOne<UserDocument>("users", { stripeCustomerId: customerId });

    if (!userDoc) {
      console.warn(`[Stripe Webhook] ⚠️ No user found for customer ${customerId}`);
      return;
    }

    const userId = userDoc.userId;

    await db.updateOne<UserDocument>(
      "users",
      { userId },
      {
        $set: {
          isMember: false,
          subscriptionStatus: "canceled",
          membershipEndedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[Stripe Webhook] ✅ User ${userId} membership canceled`);
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to cancel membership:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  try {
    const userDoc = await db.findOne<UserDocument>("users", { stripeCustomerId: customerId });

    if (!userDoc) {
      console.warn(`[Stripe Webhook] ⚠️ No user found for customer ${customerId}`);
      return;
    }

    const userId = userDoc.userId;

    // Reset usage counters for successful payment
    const { resetUsage } = await import("@/lib/saas/usage-service");
    await resetUsage(userId);

    console.log(`[Stripe Webhook] ✅ Reset usage for user ${userId} after payment`);
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to reset usage:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.warn(`[Stripe Webhook] ⚠️ Payment failed for customer ${customerId}`);

  try {
    // Find user by customer ID
    const userDoc = await db.findOne("users", { stripeCustomerId: customerId });
    const userId = userDoc?.userId || null;

    // Get error message from invoice
    // Note: Invoice type may not have all error fields directly accessible
    // We'll use safe property access and fallback to status/attempt_count
    let errorMessage = "Payment failed";
    
    // Check for error information - use type assertion for optional fields
    type InvoiceWithErrors = Stripe.Invoice & {
      last_finalization_error?: { message?: string };
      last_payment_error?: { message?: string };
    };
    const invoiceWithErrors = invoice as InvoiceWithErrors;
    if (invoiceWithErrors.last_finalization_error?.message) {
      errorMessage = invoiceWithErrors.last_finalization_error.message;
    } else if (invoiceWithErrors.last_payment_error?.message) {
      errorMessage = invoiceWithErrors.last_payment_error.message;
    } else if (invoice.status === 'open' && invoice.attempt_count && invoice.attempt_count > 0) {
      errorMessage = `Payment attempt ${invoice.attempt_count} failed`;
    } else if (invoice.status === 'uncollectible') {
      errorMessage = "Payment marked as uncollectible";
    }

    // Audit log
    await auditLog("payment_failed", "Payment failed", {
      userId,
      userRole: userId ? "member" : null,
      details: {
        invoiceId: invoice.id,
        customerId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
        status: invoice.status,
      },
      success: false,
      errorMessage,
    });
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to log payment failure:", error);
  }
}
