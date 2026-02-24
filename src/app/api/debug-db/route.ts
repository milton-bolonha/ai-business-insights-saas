import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export const runtime = 'nodejs';

export async function GET() {
    try {
        const users = await db.find("users", {}, { limit: 100 });
        const purchases = await db.find("purchases", {}, { limit: 100 });
        const transactions = await db.find("credit_transactions", {}, { limit: 100 });

        return NextResponse.json({
            meta: {
                usersCount: users.length,
                purchasesCount: purchases.length,
                transactionsCount: transactions.length
            },
            users: users,
            purchases: purchases,
            transactions: transactions
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
