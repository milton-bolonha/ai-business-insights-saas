const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Read and parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let uri = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('MONGODB_URI=')) {
    uri = line.substring('MONGODB_URI='.length).trim();
  }
});

if (!uri) {
  uri = "mongodb://localhost:27017/dashboard-engine";
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    
    // List databases
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("Databases on cluster:");
    console.log(dbsList.databases.map(d => d.name));

    for (const d of dbsList.databases) {
      if (['admin', 'local', 'config'].includes(d.name)) continue;
      const currentDb = client.db(d.name);
      const cols = await currentDb.listCollections().toArray();
      console.log(`\nDB "${d.name}" has collections:`, cols.map(c => c.name));
      if (cols.some(c => c.name === 'mentoring_profiles')) {
        const profiles = await currentDb.collection("mentoring_profiles").find({}).toArray();
        console.log(`PROFILES IN DB "${d.name}":`);
        console.log(JSON.stringify(profiles, null, 2));
      }
    }
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await client.close();
  }
}

main();
