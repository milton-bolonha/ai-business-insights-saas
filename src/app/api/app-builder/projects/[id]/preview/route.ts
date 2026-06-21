import { NextResponse } from 'next/server';
import { requireOwnedProject, updateProjectStatus } from '@/modules/app-builder/services/project.repository';
import { getProjectSandbox, ensureSandboxDevServer } from '@/modules/app-builder/services/sandbox.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);

    const sandbox = await getProjectSandbox(project.sandboxName);
    const url = sandbox.domain(3000);

    // Check if the dev server is actually responding on the public URL
    const checkResult = await checkUrlStatus(url);

    if (checkResult === 'dead') {
      // Sandbox is permanently gone (410) - client should delete and recreate
      console.log(`[AppBuilder] Sandbox "${project.sandboxName}" is DEAD (410). Client should recreate.`);
      return NextResponse.json({ status: 'dead', url });
    }

    if (checkResult === 'starting') {
      // Trigger scaffold/start inside the sandbox (non-blocking, fires once per lock period)
      ensureSandboxDevServer(sandbox).catch((err) => {
        console.error(`[AppBuilder] ensureSandboxDevServer error for "${project.sandboxName}":`, err?.message ?? err);
      });

      console.log(`[AppBuilder] Sandbox "${project.sandboxName}" not yet ready on port 3000, returning 'starting' status`);
      return NextResponse.json({ status: 'starting', url });
    }

    // Ready!
    if (project.status !== 'ready') {
      await updateProjectStatus(project._id!.toString(), 'ready');
    }

    return NextResponse.json({ status: 'ready', url });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error?.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[AppBuilder] GET /projects/[id]/preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

type UrlStatus = 'ready' | 'starting' | 'dead';

async function checkUrlStatus(url: string): Promise<UrlStatus> {
  // Mock/relative URLs are always "ready"
  if (url.startsWith('/')) return 'ready';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 410) return 'dead';   // Sandbox permanently stopped
    if (res.status === 502) return 'starting'; // Sandbox alive, no server on port
    if (res.status < 500) return 'ready';    // Serving OK
    return 'starting';
  } catch {
    return 'starting'; // Connection refused / timeout = still starting
  }
}
