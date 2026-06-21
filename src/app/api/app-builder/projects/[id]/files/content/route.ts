import { NextResponse } from 'next/server';
import { requireOwnedProject } from '@/modules/app-builder/services/project.repository';
import { getProjectSandbox } from '@/modules/app-builder/services/sandbox.service';
import { saveProjectFile } from '@/modules/app-builder/services/files.repository';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    const sandbox = await getProjectSandbox(project.sandboxName);
    const buf = await sandbox.readFileToBuffer({ path });
    const content = buf ? buf.toString('utf8') : '';

    return NextResponse.json({ content });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error?.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[Files Content API] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    const body = await req.json();
    const { path, content } = body;

    if (!path || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
    }

    const sandbox = await getProjectSandbox(project.sandboxName);
    
    // Write to sandbox
    await sandbox.writeFiles([{ path, content: Buffer.from(content) }]);
    
    // Persist to MongoDB so it survives sandbox restarts
    await saveProjectFile(id, path, content);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error?.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error?.message === 'Not found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('[Files Content API] PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
