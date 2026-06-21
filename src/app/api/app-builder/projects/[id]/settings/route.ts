import { NextResponse } from 'next/server';
import { requireOwnedProject, updateProjectSettings } from '@/modules/app-builder/services/project.repository';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    
    const body = await req.json();
    const { name, description, businessRules, designGuidelines } = body;

    await updateProjectSettings(id, {
      name,
      description,
      businessRules,
      designGuidelines
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[AppBuilder] PUT /projects/[id]/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
