import { NextResponse } from 'next/server';
import { requireOwnedProject, deleteProject } from '@/modules/app-builder/services/project.repository';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    const { userId } = await auth();

    // Ideally, we'd also delete the sandbox from Vercel via Sandbox API if supported,
    // but the Sandbox API automatically handles expiration if untouched.
    
    await deleteProject(project._id!.toString(), userId!);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error; // Thrown by requireOwnedProject
    console.error('[AppBuilder] DELETE /projects/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
