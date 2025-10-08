import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { createCaseCreatedEvent } from '@/lib/case-timeline'

export const dynamic = 'force-dynamic'

// Types for case data
interface CreateCaseRequest {
  caseNumber?: string
  title: string
  description?: string
  status: string
  priority: string
  caseType: string
  clientId: string
  assignedToId?: string
  nextHearingDate?: string
  statuteOfLimitations?: string
  estimatedValue?: number
  currency?: string
}

// GET /api/cases - List all cases
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const cases = await db.case.findMany({
      where: {
        organizationId: user.organizationId,
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

    return NextResponse.json({
      cases,
      count: cases.length,
      organizationId: user.organizationId
    })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju predmeta' },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const body: CreateCaseRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.status || !body.priority || !body.caseType || !body.clientId) {
      return NextResponse.json(
        { error: 'Naslov, status, prioritet, tip predmeta i klijent su obavezni' },
        { status: 400 }
      )
    }

    // Verify client exists and belongs to organization
    const client = await db.client.findFirst({
      where: {
        id: body.clientId,
        organizationId: user.organizationId,
        deletedAt: null
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    // Generate case number if not provided
    let caseNumber = body.caseNumber
    if (!caseNumber) {
      const count = await db.case.count({
        where: { organizationId: user.organizationId },
      })
      caseNumber = `CASE-${String(count + 1).padStart(6, '0')}`
    }

    // Handle empty date strings - convert to null for Prisma
    const processedBody = {
      ...body,
      caseNumber,
      nextHearingDate: body.nextHearingDate && body.nextHearingDate.trim() !== '' 
        ? new Date(body.nextHearingDate) 
        : null,
      statuteOfLimitations: body.statuteOfLimitations && body.statuteOfLimitations.trim() !== '' 
        ? new Date(body.statuteOfLimitations) 
        : null,
      organizationId: user.organizationId,
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
        user.userId,
        user.organizationId
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
