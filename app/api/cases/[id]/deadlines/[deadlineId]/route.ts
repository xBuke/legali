import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

// PATCH /api/cases/[id]/deadlines/[deadlineId] - Update deadline
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; deadlineId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: caseId, deadlineId } = params
    const body = await request.json()

    // Verify the case belongs to the user's organization
    const caseData = await db.case.findFirst({
      where: {
        id: caseId,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const deadline = await db.caseDeadline.updateMany({
      where: {
        id: deadlineId,
        caseId: caseId,
        organizationId: session.user.organizationId,
      },
      data: {
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        type: body.type,
        priority: body.priority,
        assignedToId: body.assignedToId || null,
      },
    })

    if (deadline.count === 0) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating deadline:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju roka' },
      { status: 500 }
    )
  }
}

// DELETE /api/cases/[id]/deadlines/[deadlineId] - Delete deadline
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; deadlineId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: caseId, deadlineId } = params

    // Verify the case belongs to the user's organization
    const caseData = await db.case.findFirst({
      where: {
        id: caseId,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const deadline = await db.caseDeadline.deleteMany({
      where: {
        id: deadlineId,
        caseId: caseId,
        organizationId: session.user.organizationId,
      },
    })

    if (deadline.count === 0) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deadline:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju roka' },
      { status: 500 }
    )
  }
}
