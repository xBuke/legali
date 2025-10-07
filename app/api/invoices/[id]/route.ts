import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for invoice update
interface UpdateInvoiceRequest {
  status?: string
  dueDate?: string
  notes?: string
  terms?: string
  paidDate?: string
  amountPaid?: number
}

// GET /api/invoices/[id] - Get a specific invoice
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

    const invoice = await db.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
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
            taxId: true,
          }
        },
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju računa' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Update an invoice
export async function PATCH(
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

    const body: UpdateInvoiceRequest = await request.json()
    const {
      status,
      dueDate,
      notes,
      terms,
      paidDate,
      amountPaid,
    } = body

    // Check if invoice exists and belongs to organization
    const existingInvoice = await db.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 })
    }

    // Validate that at least one field is provided
    const hasUpdates = Object.keys(body).some(key => body[key as keyof UpdateInvoiceRequest] !== undefined)
    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'Najmanje jedno polje mora biti ažurirano' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (notes !== undefined) updateData.notes = notes
    if (terms !== undefined) updateData.terms = terms
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null
    if (amountPaid !== undefined) updateData.amountPaid = amountPaid
    updateData.updatedAt = new Date()

    const invoice = await db.invoice.update({
      where: { id: params.id },
      data: updateData,
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
            taxId: true,
          }
        },
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju računa' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
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

    // Check if invoice exists and belongs to organization
    const invoice = await db.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 })
    }

    // Check if invoice is already paid
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Ne možete brisati već plaćene račune' },
        { status: 400 }
      )
    }

    // Unlink time entries from the invoice before deletion
    await db.timeEntry.updateMany({
      where: {
        invoiceId: params.id
      },
      data: {
        invoiceId: null,
        isBilled: false
      }
    })

    // Delete the invoice
    await db.invoice.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Račun je uspješno obrisan' 
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju računa' },
      { status: 500 }
    )
  }
}
