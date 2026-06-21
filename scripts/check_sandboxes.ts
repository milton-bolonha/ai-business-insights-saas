import { Sandbox } from '@vercel/sandbox';

async function main() {
  const sandboxes = await Sandbox.list({
    teamId: process.env.VERCEL_TEAM_ID,
    projectId: process.env.VERCEL_PROJECT_ID,
    token: process.env.VERCEL_SANDBOX_TOKEN,
  });

  for await (const sandbox of sandboxes) {
    console.log(`Sandbox: ${sandbox.name} | Status: ${sandbox.status} | Created: ${new Date(sandbox.createdAt).toISOString()}`);
  }
}

main().catch(console.error);
