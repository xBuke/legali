import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createCaseCreatedEvent } from '@/lib/case-timeline'

// GET /api/cases - List all cases
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cases = await db.case.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(cases)
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju predmeta' },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create new case
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      console.error('No session or organizationId found:', { session: !!session, userId: session?.user?.id, orgId: session?.user?.organizationId })
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    const body = await request.json()

    // Generate case number if not provided
    if (!body.caseNumber) {
      const count = await db.case.count({
        where: { organizationId: session.user.organizationId },
      })
      body.caseNumber = `CASE-${String(count + 1).padStart(6, '0')}`
    }

    // Handle empty date strings - convert to null for Prisma
    const processedBody = {
      ...body,
      nextHearingDate: body.nextHearingDate && body.nextHearingDate.trim() !== '' 
        ? new Date(body.nextHearingDate) 
        : null,
      statuteOfLimitations: body.statuteOfLimitations && body.statuteOfLimitations.trim() !== '' 
        ? new Date(body.statuteOfLimitations) 
        : null,
      organizationId: session.user.organizationId,
    }

    const caseData = await db.case.create({
      data: processedBody,
      include: {
        client: true,
        assignedTo: true,
      },
    })

    // Create timeline event for case creation
    try {
      await createCaseCreatedEvent(
        caseData.id,
        caseData.caseNumber,
        session.user.id,
        session.user.organizationId
      )
    } catch (timelineError) {
      console.error('Error creating timeline event:', timelineError)
      // Don't fail the case creation if timeline event fails
    }

    return NextResponse.json(caseData, { status: 201 })
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju predmeta' },
      { status: 500 }
    )
  }
}
