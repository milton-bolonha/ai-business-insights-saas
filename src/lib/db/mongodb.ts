import {
  MongoClient,
  type Db,
  type Collection,
  type MongoClientOptions,
  type Document,
  type Filter,
  type FindOptions,
  type OptionalUnlessRequiredId,
  type UpdateFilter,
  type UpdateOptions,
} from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
  maxConnecting: 2,
  directConnection: false,
};

const CIRCUIT_BREAKER_TIMEOUT_MS = parseInt(
  process.env.MONGODB_CIRCUIT_BREAKER_TIMEOUT_MS ?? "15000",
  10
);

// Circuit breaker state
let circuitBreakerOpen = false;
let circuitBreakerLastFailure = 0;

function isCircuitBreakerOpen(): boolean {
  if (!circuitBreakerOpen) return false;
  if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT_MS) {
    console.log("[MongoDB] 🔄 Circuit breaker reset");
    circuitBreakerOpen = false;
    return false;
  }
  return true;
}

function openCircuitBreaker() {
  console.log("[MongoDB] 🔴 Circuit breaker opened");
  circuitBreakerOpen = true;
  circuitBreakerLastFailure = Date.now();
}

// Global client cache with TTL
const globalStore = globalThis as typeof globalThis & {
  __MONGODB_CLIENT__?: {
    client: MongoClient;
    createdAt: number;
  };
};

const CLIENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getClient(): MongoClient {
  const now = Date.now();
  const cached = globalStore.__MONGODB_CLIENT__;

  if (cached && now - cached.createdAt < CLIENT_TTL_MS) {
    return cached.client;
  }

  // Create new client
  const client = new MongoClient(uri, options);
  globalStore.__MONGODB_CLIENT__ = {
    client,
    createdAt: now,
  };

  console.log("[MongoDB] 🆕 New client created");
  return client;
}

export async function connect(): Promise<MongoClient> {
  if (isCircuitBreakerOpen()) {
    throw new Error("MONGODB_CIRCUIT_OPEN");
  }

  const client = getClient();

  try {
    await client.connect();
    console.log("[MongoDB] ✅ Connected successfully");
    return client;
  } catch (error) {
    console.error("[MongoDB] ❌ Connection failed:", error);
    openCircuitBreaker();
    throw error;
  }
}

export async function getDb(): Promise<Db> {
  const client = await connect();
  return client.db();
}

export async function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export const db = {
  async findOne<T extends Document>(
    collection: string,
    filter: Filter<T>
  ): Promise<T | null> {
    try {
      const coll = await getCollection<T>(collection);
      const result = await coll.findOne(filter);
      console.log(`[MongoDB] 📖 Found document in ${collection}`);
      return result as T | null;
    } catch (error) {
      console.error(`[MongoDB] ❌ findOne failed for ${collection}:`, error);
      throw error;
    }
  },

  async find<T extends Document>(
    collection: string,
    filter: Filter<T> = {},
    options?: FindOptions
  ): Promise<T[]> {
    try {
      const coll = await getCollection<T>(collection);
      const cursor = coll.find(filter, options);
      if (options?.sort) {
        cursor.sort(options.sort);
      }
      if (options?.limit) {
        cursor.limit(options.limit);
      }
      const results = await cursor.toArray();
      console.log(`[MongoDB] 📖 Found ${results.length} documents in ${collection}`);
      return results as T[];
    } catch (error) {
      console.error(`[MongoDB] ❌ find failed for ${collection}:`, error);
      throw error;
    }
  },

  async insertOne<T extends Document>(
    collection: string,
    document: OptionalUnlessRequiredId<T>
  ): Promise<string> {
    try {
      const coll = await getCollection<T>(collection);
      const result = await coll.insertOne(document);
      console.log(`[MongoDB] ➕ Inserted document in ${collection}:`, result.insertedId);
      return result.insertedId.toString();
    } catch (error) {
      console.error(`[MongoDB] ❌ insertOne failed for ${collection}:`, error);
      throw error;
    }
  },

  async updateOne<T extends Document>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<boolean> {
    try {
      const coll = await getCollection<T>(collection);
      const result = await coll.updateOne(filter, update, options);
      const modified = result.modifiedCount > 0 || result.upsertedCount > 0;
      console.log(`[MongoDB] ✏️ Updated document in ${collection}:`, modified ? "modified" : "no changes");
      return modified;
    } catch (error) {
      console.error(`[MongoDB] ❌ updateOne failed for ${collection}:`, error);
      throw error;
    }
  },

  async deleteOne<T extends Document>(
    collection: string,
    filter: Filter<T>
  ): Promise<boolean> {
    try {
      const coll = await getCollection<T>(collection);
      const result = await coll.deleteOne(filter);
      const deleted = result.deletedCount > 0;
      console.log(`[MongoDB] 🗑️ Deleted document in ${collection}:`, deleted ? "deleted" : "not found");
      return deleted;
    } catch (error) {
      console.error(`[MongoDB] ❌ deleteOne failed for ${collection}:`, error);
      throw error;
    }
  },

  async close(): Promise<void> {
    try {
      const client = getClient();
      await client.close();
      delete globalStore.__MONGODB_CLIENT__;
      console.log("[MongoDB] 🔌 Connection closed");
    } catch (error) {
      console.error("[MongoDB] ❌ Failed to close connection:", error);
    }
  },
};

