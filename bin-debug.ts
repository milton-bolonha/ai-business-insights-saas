import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI || "";

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const purchases = await db.collection("purchases").find({}).toArray();

        console.log(`Total purchases found: ${purchases.length}`);

        const counts: Record<string, number> = {};
        purchases.forEach(p => {
            const id = p.userId || "UNDEFINED";
            counts[id] = (counts[id] || 0) + 1;
        });

        console.log("Purchases per userId:");
        console.log(counts);

        console.log("\nRecent 5 purchases:");
        purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        purchases.slice(0, 5).forEach(p => {
            console.log(`- ${p._id}: userId=${p.userId} amount=${p.amount} date=${p.createdAt}`);
        });

    } finally {
        await client.close();
    }
}

run().catch(console.error);
