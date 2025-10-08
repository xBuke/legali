import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

/**
 * GET /api/clients/[id]/billable-time
 * Get billable time entries for a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    // Verify client belongs to organization
    const client = await db.client.findFirst({
      where: {
        id: params.id,
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

    // Get billable time entries for this client
    const timeEntries = await db.timeEntry.findMany({
      where: {
        case: {
          clientId: params.id
        },
        invoiceId: null, // Only unbilled time entries
        isBillable: true,
        organizationId: user.organizationId
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate totals
    const subtotal = timeEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0)
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60
    const taxRate = 25.00 // Croatian PDV
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    return NextResponse.json({
      timeEntries,
      summary: {
        totalEntries: timeEntries.length,
        totalHours: Math.round(totalHours * 100) / 100,
        subtotal,
        taxRate,
        taxAmount,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching billable time entries:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju naplativih sati' },
      { status: 500 }
    )
  }
}
