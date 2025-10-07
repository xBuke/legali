import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for update request
interface UpdateClientRequest {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
}

// GET /api/clients/[id] - Get single client
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

    const client = await db.client.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        cases: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju klijenta' },
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id] - Update client
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

    const body: UpdateClientRequest = await request.json()

    // Validate that at least one field is provided
    if (!body.firstName && !body.lastName && !body.companyName && !body.email && !body.phone) {
      return NextResponse.json(
        { error: 'Najmanje jedno polje mora biti ažurirano' },
        { status: 400 }
      )
    }

    // If email is being updated, check for duplicates
    if (body.email) {
      const existingClient = await db.client.findFirst({
        where: {
          email: body.email,
          organizationId: user.organizationId,
          deletedAt: null,
          NOT: { id: params.id }
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Klijent s ovom email adresom već postoji' },
          { status: 409 }
        )
      }
    }

    const result = await db.client.updateMany({
      where: {
        id: params.id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      data: {
        ...body,
        updatedAt: new Date()
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    // Fetch and return the updated client
    const updatedClient = await db.client.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        clientType: true,
        email: true,
        phone: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju klijenta' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Soft delete client
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

    const result = await db.client.updateMany({
      where: {
        id: params.id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Klijent je uspješno obrisan' 
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju klijenta' },
      { status: 500 }
    )
  }
}
