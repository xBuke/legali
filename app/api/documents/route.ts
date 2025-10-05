import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/documents - List all documents
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const clientId = searchParams.get('clientId')

    const where: any = {
      organizationId: session.user.organizationId,
      deletedAt: null,
    }

    if (caseId) {
      where.caseId = caseId
    }

    if (clientId) {
      where.clientId = clientId
    }

    const documents = await db.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true,
          },
        },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju dokumenata' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create new document
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const document = await db.document.create({
      data: {
        ...body,
        organizationId: session.user.organizationId,
        uploadedById: session.user.id,
      },
      include: {
        case: true,
        client: true,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju dokumenta' },
      { status: 500 }
    )
  }
}
