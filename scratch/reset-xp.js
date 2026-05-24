const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

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
    const db = client.db('test');
    
    // Search tasks
    const tasks = await db.collection("mentoring_tasks").find({ assigneeId: "user_39gsLQxZiwK8ohoucNWwUuqe9fE" }).toArray();
    console.log("Milton's Assigned Tasks:", tasks);

    const completedTasks = await db.collection("mentoring_tasks").find({ status: "done" }).toArray();
    console.log("All Completed Tasks:", completedTasks);

    // Reset Milton's XP to 0 in DB
    const res = await db.collection("mentoring_profiles").updateOne(
      { userId: "user_39gsLQxZiwK8ohoucNWwUuqe9fE" },
      { $set: { xp: 0 } }
    );
    console.log("Reset Milton's XP to 0:", res.modifiedCount > 0 ? "Success" : "No change/Profile not found");

  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await client.close();
  }
}

main();
