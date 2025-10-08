import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for time entry creation
interface CreateTimeEntryRequest {
  caseId?: string
  date?: string
  duration: number
  description: string
  hourlyRate: number
  isBillable?: boolean
}

// GET /api/time-entries - List time entries
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const isBillable = searchParams.get('isBillable')
    const isBilled = searchParams.get('isBilled')

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    }

    if (caseId) {
      where.caseId = caseId
    }

    if (isBillable !== null) {
      where.isBillable = isBillable === 'true'
    }

    if (isBilled !== null) {
      where.isBilled = isBilled === 'true'
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              }
            }
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({
      timeEntries,
      count: timeEntries.length,
      organizationId: user.organizationId
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju unosa vremena' },
      { status: 500 }
    )
  }
}

// POST /api/time-entries - Create a new time entry
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const body: CreateTimeEntryRequest = await request.json()
    const {
      caseId,
      date,
      duration,
      description,
      hourlyRate,
      isBillable = true,
    } = body

    // Validation
    if (!description || !duration || !hourlyRate) {
      return NextResponse.json(
        { error: 'Opis, trajanje i satnica su obavezni' },
        { status: 400 }
      )
    }

    if (duration <= 0) {
      return NextResponse.json(
        { error: 'Trajanje mora biti veće od 0' },
        { status: 400 }
      )
    }

    if (hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Satnica mora biti veća od 0' },
        { status: 400 }
      )
    }

    // Verify case belongs to organization if provided
    if (caseId) {
      const caseExists = await db.case.findFirst({
        where: {
          id: caseId,
          organizationId: user.organizationId,
          deletedAt: null
        }
      })

      if (!caseExists) {
        return NextResponse.json(
          { error: 'Predmet nije pronađen' },
          { status: 404 }
        )
      }
    }

    // Calculate amount
    const amount = (duration / 60) * hourlyRate

    // Create time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        caseId: caseId || null,
        date: date ? new Date(date) : new Date(),
        duration,
        description,
        hourlyRate,
        amount,
        isBillable,
        userId: user.userId,
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Greška pri stvaranju unosa vremena' },
      { status: 500 }
    )
  }
}
