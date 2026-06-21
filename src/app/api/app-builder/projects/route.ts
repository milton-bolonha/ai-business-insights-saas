import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createProject, getProjectsByWorkspace } from '@/modules/app-builder/services/project.repository';
import { getProjectSandbox } from '@/modules/app-builder/services/sandbox.service';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const projects = await getProjectsByWorkspace(userId, workspaceId);
    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('[AppBuilder] GET /projects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, name, description, businessRules, designGuidelines } = body;

    if (!workspaceId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const project = await createProject(userId, workspaceId, name, description, businessRules, designGuidelines);

    // Dispara a criação da sandbox no background
    // (não damos await aqui pro endpoint responder rápido, e o preview lidar com o loading)
    getProjectSandbox(project.sandboxName).catch(err => {
      console.error(`[AppBuilder] Background sandbox creation failed for ${project._id}:`, err);
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('[AppBuilder] POST /projects error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
