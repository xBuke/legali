import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createStatusChangedEvent, createAssignmentEvent, createHearingScheduledEvent } from '@/lib/case-timeline'

export const dynamic = 'force-dynamic';

// GET /api/cases/[id] - Get single case
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseData = await db.case.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        client: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!caseData) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(caseData)
  } catch (error) {
    console.error('Error fetching case:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju predmeta' },
      { status: 500 }
    )
  }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get current case data to compare changes
    const currentCase = await db.case.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
    })

    if (!currentCase) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      )
    }

    // Handle empty date strings - convert to null for Prisma
    const processedBody = {
      ...body,
      nextHearingDate: body.nextHearingDate && body.nextHearingDate.trim() !== '' 
        ? new Date(body.nextHearingDate) 
        : body.nextHearingDate === '' ? null : body.nextHearingDate,
      statuteOfLimitations: body.statuteOfLimitations && body.statuteOfLimitations.trim() !== '' 
        ? new Date(body.statuteOfLimitations) 
        : body.statuteOfLimitations === '' ? null : body.statuteOfLimitations,
    }

    const caseData = await db.case.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      data: processedBody,
    })

    if (caseData.count === 0) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      )
    }

    // Create timeline events for changes
    try {
      // Status change
      if (body.status && body.status !== currentCase.status) {
        await createStatusChangedEvent(
          params.id,
          currentCase.caseNumber,
          currentCase.status,
          body.status,
          session.user.id,
          session.user.organizationId
        )
      }

      // Assignment change
      if (body.assignedToId !== currentCase.assignedToId) {
        let assignedToName = null
        if (body.assignedToId) {
          const assignedUser = await db.user.findFirst({
            where: { id: body.assignedToId },
            select: { firstName: true, lastName: true },
          })
          assignedToName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}`.trim() : null
        }

        await createAssignmentEvent(
          params.id,
          currentCase.caseNumber,
          body.assignedToId,
          assignedToName,
          session.user.id,
          session.user.organizationId
        )
      }

      // Hearing date change
      if (body.nextHearingDate && body.nextHearingDate !== currentCase.nextHearingDate?.toISOString()) {
        await createHearingScheduledEvent(
          params.id,
          currentCase.caseNumber,
          new Date(body.nextHearingDate),
          session.user.id,
          session.user.organizationId
        )
      }
    } catch (timelineError) {
      console.error('Error creating timeline events:', timelineError)
      // Don't fail the update if timeline events fail
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating case:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju predmeta' },
      { status: 500 }
    )
  }
}

// DELETE /api/cases/[id] - Soft delete case
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseData = await db.case.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    if (caseData.count === 0) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting case:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju predmeta' },
      { status: 500 }
    )
  }
}
