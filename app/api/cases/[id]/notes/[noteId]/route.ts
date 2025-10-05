import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    // Verify note exists and belongs to the case
    const existingNote = await db.note.findFirst({
      where: {
        id: params.noteId,
        caseId: params.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user can edit this note (author or admin)
    if (existingNote.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this note' }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Update note
    const updatedNote = await db.note.update({
      where: { id: params.noteId },
      data: {
        content,
        updatedAt: new Date(),
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
        type: 'NOTE_UPDATED',
        title: 'Ažurirana napomena',
        description: 'Napomena je ažurirana',
        createdById: session.user.id,
        organizationId: user.organization.id,
        metadata: JSON.stringify({
          noteId: updatedNote.id,
        }),
      },
    });

    // Transform the response to match frontend expectations
    const { createdBy, ...noteWithoutCreatedBy } = updatedNote;
    const transformedNote = {
      ...noteWithoutCreatedBy,
      author: createdBy,
      type: 'note',
      isPrivate: false,
    };

    return NextResponse.json(transformedNote);
  } catch (error) {
    console.error('Error updating case note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    // Verify note exists and belongs to the case
    const existingNote = await db.note.findFirst({
      where: {
        id: params.noteId,
        caseId: params.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user can delete this note (author or admin)
    if (existingNote.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this note' }, { status: 403 });
    }

    // Delete note
    await db.note.delete({
      where: { id: params.noteId },
    });

    // Create timeline event
    await db.caseTimeline.create({
      data: {
        caseId: params.id,
        type: 'NOTE_DELETED',
        title: 'Obrisana napomena',
        description: 'Napomena je obrisana',
        createdById: session.user.id,
        organizationId: user.organization.id,
        metadata: JSON.stringify({
          noteId: params.noteId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
