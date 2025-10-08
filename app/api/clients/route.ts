import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for client data

interface CreateClientRequest {
  clientType?: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  personalId?: string
  taxId?: string
  notes?: string
  status?: string
}

/**
 * GET /api/clients
 * List all clients for the authenticated user's organization
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    // Query clients for the user's organization
    const clients = await db.client.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        clientType: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cases: true,
            documents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      clients,
      count: clients.length,
      organizationId: user.organizationId
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju klijenata' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 * Create a new client for the authenticated user's organization
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
    }

    const body: CreateClientRequest = await request.json()

    // Validate required fields based on client type
    if (body.clientType === 'COMPANY') {
      if (!body.companyName) {
        return NextResponse.json(
          { error: 'Naziv tvrtke je obavezan' },
          { status: 400 }
        )
      }
    } else {
      if (!body.firstName || !body.lastName) {
        return NextResponse.json(
          { error: 'Ime i prezime su obavezni' },
          { status: 400 }
        )
      }
    }

    // Check if client with same email already exists in organization (only if email is provided)
    if (body.email) {
      const existingClient = await db.client.findFirst({
        where: {
          email: body.email,
          organizationId: user.organizationId,
          deletedAt: null
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Klijent s ovom email adresom već postoji' },
          { status: 409 }
        )
      }
    }

    // Create new client
    const newClient = await db.client.create({
      data: {
        clientType: body.clientType || 'INDIVIDUAL',
        firstName: body.firstName,
        lastName: body.lastName,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        mobile: body.mobile,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country || 'Croatia',
        personalId: body.personalId,
        taxId: body.taxId,
        notes: body.notes,
        status: body.status || 'ACTIVE',
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        clientType: true,
        email: true,
        phone: true,
        status: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cases: true,
            documents: true
          }
        }
      }
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Greška pri stvaranju klijenta' },
      { status: 500 }
    )
  }
}