import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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
