import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadEncryptedDocument } from '@/lib/document-storage'

export const dynamic = 'force-dynamic';

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

// POST /api/documents - Upload new document with encryption
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const caseId = formData.get('caseId') as string
    const clientId = formData.get('clientId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Datoteka je obavezna' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Datoteka je prevelika. Maksimalna veličina je 50MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tip datoteke nije podržan' },
        { status: 400 }
      )
    }

    // Upload and encrypt document
    const result = await uploadEncryptedDocument(file, {
      caseId: caseId || undefined,
      clientId: clientId || undefined,
      organizationId: session.user.organizationId,
      uploadedById: session.user.id,
      title: title || undefined,
      description: description || undefined,
      category: category || undefined,
      tags: tags || undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Greška pri učitavanju dokumenta' },
        { status: 500 }
      )
    }

    // Get the created document
    const document = await db.document.findUnique({
      where: { id: result.documentId },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true
          }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Greška pri učitavanju dokumenta' },
      { status: 500 }
    )
  }
}
