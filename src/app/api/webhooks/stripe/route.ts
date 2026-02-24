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
  let userId = session.client_reference_id || session.metadata?.userId;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  let email = session.customer_details?.email || session.customer_email;

  if (!userId) {
    if (!email && stripeCustomerId) {
      try {
        const cust = await stripe.customers.retrieve(stripeCustomerId);
        if (!cust.deleted && (cust as any).email) {
          email = (cust as any).email;
        }
      } catch (e) { console.error("[Stripe Webhook] customer fetch failed:", e); }
    }

    if (email) {
      const existingUser = await db.findOne("users", { email }) as any;
      if (existingUser) {
        userId = existingUser.userId || existingUser.clerkId;
        console.log(`[Stripe Webhook] Resolved TargetUser via email mapping: ${userId}`);
      }
    }

    if (!userId) {
      const { randomUUID } = await import("crypto");
      userId = `guest_${randomUUID()}`;
      console.log(`[Stripe Webhook] Generated anonymous TargetUser: ${userId}`);
    }
  }

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

  const acquiredCredits = plan === "business" ? 50000 : 10000;

  try {
    const existingPurchase = await db.findOne("purchases", { stripeSessionId: session.id });

    if (!existingPurchase) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      // 1. Mark user as member in database and give credits
      try {
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
            $inc: {
              creditsTotal: acquiredCredits
            },
            $setOnInsert: {
              userId,
              email: email || undefined,
              createdAt: new Date(),
              creditsUsed: 0
            },
          },
          { upsert: true }
        );
      } catch (error: any) {
        if (error.code === 11000 && email) {
          console.log(`[Stripe Webhook] Duplicate email ${email} found. Merging membership to existing user.`);
          const existingUser = await db.findOne<UserDocument>("users", { email });
          if (existingUser) {
            const oldUserId = existingUser.userId || (existingUser as any).clerkId;
            if (userId && oldUserId && userId !== oldUserId) {
              console.log(`[Stripe Webhook] Profound Merge: Migrating data from ${oldUserId} to ${userId}`);
              await db.updateMany("purchases", { userId: oldUserId }, { $set: { userId } });
              await db.updateMany("credit_transactions", { userId: oldUserId }, { $set: { userId } });
              await db.updateMany("workspaces", { userId: oldUserId }, { $set: { userId } });
              await db.updateMany("guest_workspaces", { userId: oldUserId }, { $set: { userId } });
            } else {
              userId = oldUserId || userId;
            }

            await db.updateOne<UserDocument>(
              "users",
              { email },
              {
                $set: {
                  userId,
                  clerkId: userId,
                  isMember: true,
                  stripeCustomerId,
                  subscriptionId,
                  plan,
                  membershipStartedAt: new Date(),
                  updatedAt: new Date(),
                  migrationNeeded: true,
                },
                $inc: { creditsTotal: acquiredCredits }
              }
            );
          }
        } else {
          throw error;
        }
      }

      // 2. Insert Purchase record for history and tracking
      await db.insertOne("purchases", {
        userId,
        stripeSessionId: session.id,
        stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        amount: session.amount_total || 0,
        currency: session.currency || "brl",
        plan,
        status: session.payment_status || "paid",
        createdAt: new Date(),
        acquiredCredits
      });

      console.log(`[Stripe Webhook] ✅ User ${userId} marked as member`);
      console.log(`[Stripe Webhook] 📝 Migration flag set - client should migrate localStorage data`);
      console.log(`[Stripe Webhook] 💰 Purchase recorded, added ${acquiredCredits} credits.`);
    } else {
      console.log(`[Stripe Webhook] ⏩ Purchase ${session.id} already processed. Skipping duplicate user credit assignment.`);
    }
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Failed to update user membership or create purchase:", error);
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
