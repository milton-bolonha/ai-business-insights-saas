const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

console.log('Testing direct MongoDB connection...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        const collections = await client.db().listCollections().toArray();
        console.log('✅ Collections found:', collections.length);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.close();
    }
}

run();
