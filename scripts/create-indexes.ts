#!/usr/bin/env node
/**
 * MongoDB Index Creation Script
 *
 * Creates all necessary indexes for optimal query performance.
 *
 * Usage:
 *   npm run create-indexes
 *   tsx scripts/create-indexes.ts
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (required)
 *
 * This script is idempotent - safe to run multiple times.
 */

import { createIndexes, listIndexes } from "../src/lib/db/indexes";
import { getDb } from "../src/lib/db/mongodb";

async function main() {
  console.log("🚀 MongoDB - Index Creation Script");
  console.log("━".repeat(60));
  console.log("");

  // Check MongoDB URI
  if (!process.env.MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI environment variable is required");
    console.error("");
    console.error("Please set MONGODB_URI in your .env.local file:");
    console.error(
      "  MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database"
    );
    process.exit(1);
  }

  try {
    // Test connection
    console.log("📡 Testing MongoDB connection...");
    const db = await getDb();
    const adminDb = db.admin();
    const serverStatus = await adminDb.serverStatus();
    console.log(`✅ Connected to MongoDB (version: ${serverStatus.version})`);
    console.log("");

    // Create indexes
    console.log("🔧 Creating indexes...");
    console.log("");
    await createIndexes();
    console.log("");

    // List all indexes for verification
    console.log("📊 Verifying indexes...");
    console.log("");

    const collections = ["contacts", "notes", "tiles", "workspaces"];
    for (const collectionName of collections) {
      try {
        const indexes = await listIndexes(collectionName);
        console.log(`  ${collectionName}:`);
        indexes.forEach((idx) => {
          console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });
      } catch (error) {
        console.warn(`  ⚠️  Could not list indexes for ${collectionName}`);
      }
    }

    console.log("");
    console.log("✅ Index creation completed successfully!");
    console.log("");
    console.log("💡 Tip: Indexes are idempotent - you can run this script");
    console.log("   multiple times safely. Existing indexes will be skipped.");
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ Error creating indexes:");
    console.error(error instanceof Error ? error.message : String(error));
    console.error("");
    console.error("🔧 Troubleshooting:");
    console.error("  1. Verify MONGODB_URI is correct");
    console.error("  2. Check MongoDB connection (firewall, IP whitelist)");
    console.error("  3. Ensure database user has index creation permissions");
    console.error("");
    process.exit(1);
  }
}

// Run script
main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
