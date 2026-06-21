import { NextResponse } from 'next/server';
import { requireOwnedProject } from '@/modules/app-builder/services/project.repository';
import { getProjectSandbox } from '@/modules/app-builder/services/sandbox.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    
    // We use getProjectSandbox to safely connect and use credentials
    const sandbox = await getProjectSandbox(project.sandboxName);

    // Find all files, excluding node_modules, .next, and hidden git folders.
    const result = await sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', 'find . -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" -type f | sed "s|^./||"']
    });

    const outText = await result.stdout();
    const files = outText.split('\n').map(f => f.trim()).filter(Boolean);

    return NextResponse.json({ files });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error?.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[Files API] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
