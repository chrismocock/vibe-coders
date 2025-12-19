import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StartValidationRunError, startValidationRun } from '@/server/validation/startValidationRun';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, idea } = await req.json();
    // idea should contain: { title: string, summary?: string, aiReview?: string }
    
    if (!projectId || !idea?.title) {
      return NextResponse.json(
        { error: 'projectId and idea.title are required' },
        { status: 400 }
      );
    }

    try {
      const reportId = await startValidationRun({
        projectId,
        userId,
        idea,
      });
      return NextResponse.json({ reportId });
    } catch (error) {
      if (error instanceof StartValidationRunError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error('Failed to start validation run:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to start validation run' },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

