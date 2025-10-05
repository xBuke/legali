import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

// GET /api/cases/[id]/timeline - Get case timeline
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.id

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

    const timeline = await db.caseTimeline.findMany({
      where: {
        caseId: caseId,
        organizationId: session.user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('Error fetching case timeline:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju povijesti predmeta' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/timeline - Create timeline event
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.id
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

    const timelineEvent = await db.caseTimeline.create({
      data: {
        type: body.type,
        title: body.title,
        description: body.description,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        caseId: caseId,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(timelineEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating timeline event:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju aktivnosti' },
      { status: 500 }
    )
  }
}
