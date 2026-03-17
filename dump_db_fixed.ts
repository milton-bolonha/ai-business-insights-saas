import { db } from "./src/lib/db/mongodb";

async function dumpDB() {
  const userId = "user_39gsLQxZiwK8ohoucNWwUuqe9fE";
  
  console.log("--- SEARCHING FOR USER DATA ---");
  
  console.log("\n--- WORKSPACES ---");
  const ws = await db.find("workspaces", { userId });
  ws.forEach(w => console.log(`Workspace: sessionId=${w.sessionId} name=${w.name} _id=${w._id}`));

  console.log("\n--- DASHBOARDS ---");
  const ds = await db.find("dashboards", { userId });
  ds.forEach(d => console.log(`Dashboard: id=${d.id} workspaceId=${d.workspaceId} _id=${d._id}`));

  console.log("\n--- TILES (First 10) ---");
  const ts = await db.find("tiles", { userId }, { limit: 10 });
  ts.forEach(t => console.log(`Tile: id=${t.id} workspaceId=${t.workspaceId} dashboardId=${t.dashboardId} title=${t.title}`));

  process.exit(0);
}

dumpDB().catch(e => {
  console.error(e);
  process.exit(1);
});
