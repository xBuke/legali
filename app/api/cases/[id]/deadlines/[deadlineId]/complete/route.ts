import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/cases/[id]/deadlines/[deadlineId]/complete - Mark deadline as completed
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
        status: 'completed',
        completedAt: new Date(),
      },
    })

    if (deadline.count === 0) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing deadline:', error)
    return NextResponse.json(
      { error: 'Greška pri označavanju roka kao završen' },
      { status: 500 }
    )
  }
}
