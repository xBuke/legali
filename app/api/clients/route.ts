import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createActivityLog } from '@/lib/activity-logger'

// GET /api/clients - List all clients
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await db.client.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null, // Only show non-deleted clients
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            cases: true,
            documents: true,
          },
        },
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju klijenata' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const client = await db.client.create({
      data: {
        ...body,
        organizationId: session.user.organizationId,
      },
    })

    // Log activity
    await createActivityLog({
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      userId: session.user.id,
      organizationId: session.user.organizationId,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju klijenta' },
      { status: 500 }
    )
  }
}
