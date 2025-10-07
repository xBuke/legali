import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types for client data
interface Client {
  id: string
  name: string
  email: string
  phone?: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

interface CreateClientRequest {
  name: string
  email: string
  phone?: string
}

/**
 * GET /api/clients
 * List all clients for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
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
        createdAt: true,
        updatedAt: true
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

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Ime i email su obavezni' },
        { status: 400 }
      )
    }

    // Check if client with same email already exists in organization
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

    // Create new client
    const newClient = await db.client.create({
      data: {
        firstName: body.name.split(' ')[0] || '',
        lastName: body.name.split(' ').slice(1).join(' ') || '',
        email: body.email,
        phone: body.phone,
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
        organizationId: true,
        createdAt: true,
        updatedAt: true
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