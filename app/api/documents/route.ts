import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { uploadEncryptedDocument } from '@/lib/document-storage'

export const dynamic = 'force-dynamic'

// Types for document upload
interface DocumentUploadData {
  caseId?: string
  clientId?: string
  title?: string
  description?: string
  category?: string
  tags?: string
}

// GET /api/documents - List all documents
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
    const caseId = searchParams.get('caseId')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
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

    return NextResponse.json({
      documents,
      count: documents.length,
      organizationId: user.organizationId
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju dokumenata' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload new document with encryption
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      )
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

    // Verify case belongs to organization if provided
    if (caseId) {
      const caseExists = await db.case.findFirst({
        where: {
          id: caseId,
          organizationId: user.organizationId,
          deletedAt: null
        }
      })

      if (!caseExists) {
        return NextResponse.json(
          { error: 'Predmet nije pronađen' },
          { status: 404 }
        )
      }
    }

    // Verify client belongs to organization if provided
    if (clientId) {
      const clientExists = await db.client.findFirst({
        where: {
          id: clientId,
          organizationId: user.organizationId,
          deletedAt: null
        }
      })

      if (!clientExists) {
        return NextResponse.json(
          { error: 'Klijent nije pronađen' },
          { status: 404 }
        )
      }
    }

    // Upload and encrypt document
    const result = await uploadEncryptedDocument(file, {
      caseId: caseId || undefined,
      clientId: clientId || undefined,
      organizationId: user.organizationId,
      uploadedById: user.userId,
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
