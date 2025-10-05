import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify case belongs to user's organization
    const case_ = await db.case.findFirst({
      where: {
        id: params.id,
        client: { organizationId: user.organization.id },
      },
    });

    if (!case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get notes for the case
    const notes = await db.note.findMany({
      where: { caseId: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the response to match frontend expectations
    const transformedNotes = notes.map(note => ({
      ...note,
      author: note.createdBy,
      type: 'note',
      isPrivate: false,
    })).map(note => {
      const { createdBy, ...noteWithoutCreatedBy } = note;
      return noteWithoutCreatedBy;
    });

    return NextResponse.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching case notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify case belongs to user's organization
    const case_ = await db.case.findFirst({
      where: {
        id: params.id,
        client: { organizationId: user.organization.id },
      },
    });

    if (!case_) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const { content, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create new note
    const note = await db.note.create({
      data: {
        content,
        caseId: params.id,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create timeline event
    await db.caseTimeline.create({
      data: {
        caseId: params.id,
        type: 'NOTE_ADDED',
        title: 'Dodana napomena',
        description: 'Dodana napomena',
        createdById: session.user.id,
        organizationId: user.organization.id,
        metadata: JSON.stringify({
          noteId: note.id,
        }),
      },
    });

    // Transform the response to match frontend expectations
    const { createdBy, ...noteWithoutCreatedBy } = note;
    const transformedNote = {
      ...noteWithoutCreatedBy,
      author: createdBy,
      type: type || 'note',
      isPrivate: false,
    };

    return NextResponse.json(transformedNote);
  } catch (error) {
    console.error('Error creating case note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
