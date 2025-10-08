import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for invoice creation
interface CreateInvoiceRequest {
  clientId: string
  dueDate: string
  notes?: string
  terms?: string
}

// GET /api/invoices - List all invoices for the organization
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
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (status) {
      where.status = status
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
          }
        },
      },
      orderBy: {
        issueDate: 'desc'
      }
    })

    return NextResponse.json({
      invoices,
      count: invoices.length,
      organizationId: user.organizationId
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju računa' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const body: CreateInvoiceRequest = await request.json()
    const {
      clientId,
      dueDate,
      notes,
      terms,
    } = body

    // Validation
    if (!clientId || !dueDate) {
      return NextResponse.json(
        { error: 'Klijent i datum dospijeća su obavezni' },
        { status: 400 }
      )
    }

    // Verify client belongs to organization
    const client = await db.client.findFirst({
      where: {
        id: clientId,
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

    // Calculate totals from time entries
    const timeEntries = await db.timeEntry.findMany({
      where: {
        case: {
          clientId: clientId
        },
        invoiceId: null, // Only unbilled time entries
        organizationId: user.organizationId
      }
    })

    const subtotal = timeEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0)
    const taxRate = 25.00 // Croatian PDV
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' }
    })

    const invoiceNumber = lastInvoice 
      ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).padStart(6, '0')}`
      : 'INV-000001'

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        dueDate: new Date(dueDate),
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes,
        terms,
        clientId,
        organizationId: user.organizationId
      }
    })

    // Link time entries to the invoice
    if (timeEntries.length > 0) {
      await db.timeEntry.updateMany({
        where: {
          id: { in: timeEntries.map(entry => entry.id) }
        },
        data: {
          invoiceId: invoice.id,
          isBilled: true
        }
      })
    }

    // Return invoice with related data
    const createdInvoice = await db.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
          }
        },
      }
    })

    return NextResponse.json(createdInvoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Greška pri stvaranju računa' },
      { status: 500 }
    )
  }
}
