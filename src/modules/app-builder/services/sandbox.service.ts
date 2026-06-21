import { Sandbox } from '@vercel/sandbox';
import { getProjectFiles } from './files.repository';

const DEV_PORT = 3000;

/** 
 * Module-level lock: tracks sandboxes currently being initialized.
 * Prevents concurrent kill/restart loops from multiple polling requests.
 * Key: sandboxName, Value: timestamp of last initialization start
 */
const initLock = new Map<string, number>();
const INIT_LOCK_TTL_MS = 3 * 60 * 1000; // 3 minutes - enough for full Next.js scaffold

function isInitLocked(sandboxName: string): boolean {
  const ts = initLock.get(sandboxName);
  if (!ts) return false;
  if (Date.now() - ts > INIT_LOCK_TTL_MS) {
    initLock.delete(sandboxName);
    return false;
  }
  return true;
}

function acquireInitLock(sandboxName: string) {
  initLock.set(sandboxName, Date.now());
  console.log(`[Sandbox] 🔒 Lock acquired for "${sandboxName}"`);
}

function releaseInitLock(sandboxName: string) {
  initLock.delete(sandboxName);
  console.log(`[Sandbox] 🔓 Lock released for "${sandboxName}"`);
}

function getSandboxCredentials() {
  const token = process.env.VERCEL_SANDBOX_TOKEN || process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  console.log('[Sandbox] ▶ Credential check:', {
    VERCEL_SANDBOX_TOKEN: token ? `✅ set (${token.slice(0, 8)}...)` : '❌ MISSING',
    VERCEL_TEAM_ID: teamId ? `✅ set (${teamId.slice(0, 8)}...)` : '❌ MISSING',
    VERCEL_PROJECT_ID: projectId ? `✅ set (${projectId.slice(0, 8)}...)` : '❌ MISSING',
  });

  const missing: string[] = [];
  if (!token) missing.push('VERCEL_SANDBOX_TOKEN (or VERCEL_TOKEN)');
  if (!teamId) missing.push('VERCEL_TEAM_ID');
  if (!projectId) missing.push('VERCEL_PROJECT_ID');

  if (missing.length > 0) {
    console.warn(`[Sandbox] ⚠️  Missing required env vars: ${missing.join(', ')}. Using mock locally.`);
    return null;
  }

  return { token: token!, teamId: teamId!, projectId: projectId! };
}

export async function getProjectSandbox(sandboxName: string): Promise<Sandbox> {
  const creds = getSandboxCredentials();

  if (!creds) {
    return buildMockSandbox(sandboxName, 'Missing environment variables');
  }

  try {
    console.log(`[Sandbox] 🚀 Attempting real Vercel Sandbox for "${sandboxName}"...`);

    const sandbox = await Sandbox.getOrCreate({
      name: sandboxName,
      token: creds.token,
      teamId: creds.teamId,
      projectId: creds.projectId,
      runtime: 'node24',
      ports: [DEV_PORT],
      timeout: 45 * 60 * 1000,
      tags: { module: 'app-builder' },
      onCreate: scaffoldNextProject,
      onResume: startDevServer,
    });

    console.log(`[Sandbox] ✅ Real Vercel Sandbox ready: "${sandbox.name}"`);
    return sandbox;
  } catch (error: any) {
    console.error(`[Sandbox] ❌ Real Sandbox failed for "${sandboxName}":`, error?.message ?? error);
    return buildMockSandbox(sandboxName, error?.message ?? 'Unknown error');
  }
}

export async function ensureSandboxDevServer(sandbox: Sandbox): Promise<boolean> {
  const name = sandbox.name;

  // Check if port is already listening inside the sandbox
  // If it is, the dev server is ready (or at least compiling, which is fine to show in the iframe).
  const isPortOpen = await checkPortInsideSandbox(sandbox, DEV_PORT);

  if (isPortOpen) {
    // Dev server is running. If we had a lock, we can release it early!
    if (isInitLocked(name)) {
      releaseInitLock(name);
    }
    return true; // Ready!
  }

  // If already being initialized by a concurrent request, skip
  if (isInitLocked(name)) {
    console.log(`[Sandbox] ⏳ Initialization already in progress for "${name}", skipping concurrent request`);
    return false; // Not ready yet
  }

  acquireInitLock(name);

  try {
    console.log(`[Sandbox] 🔨 No process on port 3000 in "${name}", initializing...`);
    
    // Check if project is valid before starting (needs package.json AND a Next.js directory)
    const hasPkg = await runCheckCommand(sandbox, 'test -f package.json && (test -d app || test -d src || test -d pages) && echo "yes" || echo "no"');
    
    if (hasPkg !== 'yes') {
      console.log(`[Sandbox] 📦 No valid package.json found, scaffolding Next.js...`);
      await scaffoldNextProject(sandbox);
    } else {
      console.log(`[Sandbox] 📂 package.json found, starting dev server...`);
      await startDevServer(sandbox);
    }

    return false; // Started but not ready yet - caller polls externally
  } catch (err: any) {
    console.error(`[Sandbox] ❌ Failed to initialize dev server for "${name}":`, err?.message ?? err);
    releaseInitLock(name); // Release lock on error so it can retry later
    throw err;
  }
}

async function checkPortInsideSandbox(sandbox: Sandbox, port: number): Promise<boolean> {
  try {
    const result = await sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`],
    });
    const code = (await result.stdout()).trim();
    console.log(`[Sandbox] 🔍 Internal port ${port} check: HTTP ${code || 'no-response'}`);
    
    if (code === '' || code === '000' || code.includes('000')) {
      sandbox.runCommand({ cmd: 'bash', args: ['-c', 'tail -n 10 dev.log 2>/dev/null'] })
        .then(async (res) => {
          const logs = (await res.stdout()).trim();
          if (logs) console.log(`[Sandbox] 📜 dev.log tail:\n${logs}`);
        }).catch(() => {});
      return false;
    }
    const httpCode = parseInt(code);
    return !isNaN(httpCode) && httpCode > 0 && httpCode < 500;
  } catch {
    return false;
  }
}

async function runCheckCommand(sandbox: Sandbox, cmd: string): Promise<string> {
  try {
    const result = await sandbox.runCommand({ cmd: 'bash', args: ['-lc', cmd] });
    return (await result.stdout()).trim();
  } catch {
    return '';
  }
}

function buildMockSandbox(sandboxName: string, reason: string): Sandbox {
  console.warn(`[Sandbox] 🟡 Using LOCAL MOCK for "${sandboxName}". Reason: ${reason}`);
  return {
    name: sandboxName,
    domain: (_port: number) => `/api/app-builder/mock-sandbox?name=${encodeURIComponent(sandboxName)}`,
    runCommand: async () => ({ exitCode: 0, stdout: async () => '', stderr: async () => '' }),
  } as unknown as Sandbox;
}

async function scaffoldNextProject(sandbox: Sandbox) {
  console.log(`[Sandbox] 🔨 Scaffolding new Next.js project in "${sandbox.name}"...`);
  console.log(`[Sandbox] ⚠️  This may take 2-5 minutes. Lock will hold for ${INIT_LOCK_TTL_MS / 60000} min.`);

  const defaultPage = `
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Seu App está pronto!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            A Vercel Sandbox foi inicializada com sucesso com Tailwind CSS. Peça para o Agente Construtor criar a interface do seu aplicativo.
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Tailwind + Next.js Online
          </div>
        </div>
      </div>
    </div>
  );
}`;

  const escapedPage = defaultPage.replace(/"/g, '\\"').replace(/\n/g, ' ');

  const create = await sandbox.runCommand({
    cmd: 'bash',
    args: [
      '-lc',
      `npx -y create-next-app@latest temp_next_scaffold --ts --tailwind --app --no-eslint --src-dir=false --import-alias "@/*" --use-pnpm && echo "${escapedPage}" > temp_next_scaffold/app/page.tsx && tar -cf - -C temp_next_scaffold . | tar -xf - && rm -rf temp_next_scaffold`
    ],
  });

  if (create.exitCode !== 0) {
    const errText = await create.stderr().catch(() => 'stderr unavailable');
    const outText = await create.stdout().catch(() => 'stdout unavailable');
    console.error(`[Sandbox] ❌ Scaffold failed:`, errText, outText);
    throw new Error(`Scaffold falhou: ${errText}`);
  }

  console.log(`[Sandbox] ✅ Scaffold complete.`);
  
  // RESTAURAR ARQUIVOS DA IA
  const projectId = sandbox.name.replace('app-', '');
  try {
    const aiFiles = await getProjectFiles(projectId);
    if (aiFiles.length > 0) {
      console.log(`[Sandbox] ♻️ Restoring ${aiFiles.length} AI generated files from MongoDB...`);
      const filesToWrite = aiFiles.map(f => ({
        path: f.path,
        content: Buffer.from(f.content)
      }));
      await sandbox.writeFiles(filesToWrite);
      console.log(`[Sandbox] ✅ Files restored.`);
    }
  } catch(e) {
    console.error(`[Sandbox] ❌ Failed to restore AI files:`, e);
  }

  console.log(`[Sandbox] ▶ Starting dev server...`);
  await startDevServer(sandbox);
}

async function startDevServer(sandbox: Sandbox) {
  console.log(`[Sandbox] ▶ Starting Next.js dev server bound to 0.0.0.0:${DEV_PORT}...`);

  await sandbox.runCommand({ cmd: 'bash', args: ['-lc', "pkill -f 'next dev' || true"] })
    .catch((err: any) => console.warn('[Sandbox] pkill step skipped:', err?.message));

  await new Promise(r => setTimeout(r, 1000));

  await sandbox.runCommand({
    cmd: 'bash',
    args: ['-lc', 'WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true nohup npx next dev --turbo --port ' + DEV_PORT + ' --hostname 0.0.0.0 > dev.log 2>&1 &'],
  }).catch((err: any) => {
    console.error('[Sandbox] ❌ Failed to start dev server:', err?.message ?? err);
    throw err;
  });

  console.log(`[Sandbox] ✅ pnpm dev started in background. Waiting for Next.js to compile (may take 30-90s on first start)...`);
}
