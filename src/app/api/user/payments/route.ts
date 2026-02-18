import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            console.warn("[api/user/payments] Unauthorized: No userId found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get User's Stripe Info from DB
        const user = await db.findOne<{ stripeCustomerId?: string; email?: string }>("users", { userId });

        let stripeCustomerId = user?.stripeCustomerId;
        let userEmail = user?.email;

        // 2. Recovery: If user or email missing, fetch from Clerk
        if (!user || !userEmail) {
            console.log(`[api/user/payments] User/Email missing for ${userId}. Attempting recovery via Clerk.`);
            try {
                const { clerkClient } = await import("@clerk/nextjs/server");
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(userId);
                userEmail = clerkUser.emailAddresses[0]?.emailAddress;
                console.log(`[api/user/payments] Recovered email from Clerk: ${userEmail}`);

                // Sync to DB to fix the broken state permanently
                if (userEmail) {
                    await db.updateOne(
                        "users",
                        { userId },
                        {
                            $set: {
                                email: userEmail,
                                clerkId: userId,
                                firstName: clerkUser.firstName,
                                lastName: clerkUser.lastName,
                                updatedAt: new Date()
                            },
                            $setOnInsert: { createdAt: new Date() }
                        },
                        { upsert: true }
                    );
                    console.log(`[api/user/payments] Lazily synced user ${userId} to DB`);
                }
            } catch (err) {
                console.error("[api/user/payments] Failed to recover user from Clerk:", err);
            }
        }

        // 3. Fallback: Search Stripe by Email if no Customer ID stored
        if (!stripeCustomerId && userEmail) {
            console.log(`[api/user/payments] No Stripe ID for ${userId}, searching Stripe by email: ${userEmail}`);
            const customers = await stripe.customers.list({
                email: userEmail,
                limit: 1
            });
            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                console.log(`[api/user/payments] Found Stripe Customer via email: ${stripeCustomerId}`);

                // Save this Stripe ID to the user record for future speed
                await db.updateOne("users", { userId }, { $set: { stripeCustomerId } });
            } else {
                console.warn(`[api/user/payments] No Stripe Customer found for email: ${userEmail}`);
            }
        }

        if (!stripeCustomerId) {
            console.log(`[api/user/payments] FATAL: No Stripe Customer found for ${userId} (checked DB and Email)`);
            return NextResponse.json({ purchases: [] });
        }

        // 3. Fetch Charges (Payments) from Stripe
        // We look for successful charges. Expanding invoice gives us subscription details if needed.
        const stripeParams = {
            customer: stripeCustomerId,
            limit: 100,
            expand: ["data.invoice"]
        };
        console.log(`[api/user/payments] 🟡 Calling Stripe API with params:`, JSON.stringify(stripeParams));

        try {
            const charges = await stripe.charges.list(stripeParams);
            console.log(`[api/user/payments] 🟢 Stripe Response: found ${charges.data.length} charges`);

            if (charges.data.length > 0) {
                console.log(`[api/user/payments] First charge sample:`, JSON.stringify(charges.data[0].id));
            }

            // 4. Map to simplified format and SYNC to DB (Backfill)
            const purchases = await Promise.all(charges.data.map(async (charge: any) => {
                const purchaseData = {
                    userId, // Ensure we link to the current user
                    stripeSessionId: charge.id, // Using charge ID as session ID equivalent for backfill
                    stripeCustomerId: charge.customer,
                    stripeSubscriptionId: charge.invoice?.subscription as string || null,
                    amount: charge.amount, // amount in cents
                    currency: charge.currency,
                    plan: charge.invoice?.subscription ? "subscription" : "one-time",
                    status: charge.status,
                    createdAt: new Date(charge.created * 1000),
                    receiptUrl: charge.receipt_url,
                    syncedFromStripe: true
                };

                // Check if exists in DB to avoid duplicates
                // We search by stripeSessionId (which we map to charge.id for direct charges)
                const existing = await db.findOne("purchases", { stripeSessionId: charge.id });

                if (!existing) {
                    console.log(`[api/user/payments] Backfilling purchase ${charge.id} to DB`);
                    await db.insertOne("purchases", purchaseData);
                }

                return {
                    _id: charge.id,
                    ...purchaseData
                };
            }));

            console.log(`[api/user/payments] Returning ${purchases.length} purchases (synced to DB)`);
            return NextResponse.json({ purchases });

        } catch (stripeError: any) {
            console.error(`[api/user/payments] 🔴 Stripe API Error:`, stripeError);
            return NextResponse.json(
                { error: `Stripe API Error: ${stripeError.message}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("[api/user/payments] Error fetching Stripe payments:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment history" },
            { status: 500 }
        );
    }
}
