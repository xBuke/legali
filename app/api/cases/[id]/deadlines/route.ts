import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

// GET /api/cases/[id]/deadlines - Get case deadlines
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

    const deadlines = await db.caseDeadline.findMany({
      where: {
        caseId: caseId,
        organizationId: session.user.organizationId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    return NextResponse.json(deadlines)
  } catch (error) {
    console.error('Error fetching case deadlines:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju rokova' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/deadlines - Create deadline
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

    const deadline = await db.caseDeadline.create({
      data: {
        title: body.title,
        description: body.description,
        dueDate: new Date(body.dueDate),
        type: body.type,
        priority: body.priority,
        assignedToId: body.assignedToId || null,
        caseId: caseId,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(deadline, { status: 201 })
  } catch (error) {
    console.error('Error creating deadline:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju roka' },
      { status: 500 }
    )
  }
}
