import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

// GET /api/clients/[id] - Get single client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await db.client.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const client = await db.client.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      data: body,
    })

    if (client.count === 0) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await db.client.updateMany({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    if (client.count === 0) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju klijenta' },
      { status: 500 }
    )
  }
}
