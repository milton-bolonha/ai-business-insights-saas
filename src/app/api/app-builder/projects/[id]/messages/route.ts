import { NextResponse } from 'next/server';
import { requireOwnedProject, MESSAGES_COLLECTION } from '@/modules/app-builder/services/project.repository';
import { db } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);

    const messages = await db.find<any>(
      MESSAGES_COLLECTION,
      { projectId: new ObjectId(project._id) },
      { sort: { createdAt: 1 } }
    );

    return NextResponse.json({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
