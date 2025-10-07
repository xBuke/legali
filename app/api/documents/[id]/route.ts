import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { getDocumentMetadata, deleteDocument } from '@/lib/document-storage'

export const dynamic = 'force-dynamic'

// Types for document update
interface UpdateDocumentRequest {
  title?: string
  description?: string
  category?: string
  tags?: string
  caseId?: string
  clientId?: string
}

// GET /api/documents/[id] - Get document details
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

    const result = await getDocumentMetadata(params.id, user.organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Dokument nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju dokumenta' },
      { status: 500 }
    )
  }
}

// PATCH /api/documents/[id] - Update document
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

    const body: UpdateDocumentRequest = await request.json()

    // Validate that at least one field is provided
    const hasUpdates = Object.keys(body).some(key => body[key as keyof UpdateDocumentRequest] !== undefined)
    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'Najmanje jedno polje mora biti ažurirano' },
        { status: 400 }
      )
    }

    // Verify case belongs to organization if provided
    if (body.caseId) {
      const caseExists = await db.case.findFirst({
        where: {
          id: body.caseId,
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
    if (body.clientId) {
      const clientExists = await db.client.findFirst({
        where: {
          id: body.clientId,
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

    const document = await db.document.update({
      where: {
        id: params.id,
        organizationId: user.organizationId,
        deletedAt: null
      },
      data: {
        ...body,
        updatedAt: new Date()
      },
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
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Greška pri ažuriranju dokumenta' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document
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

    const result = await deleteDocument(
      params.id,
      user.userId,
      user.organizationId
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Greška pri brisanju dokumenta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Dokument je uspješno obrisan' 
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Greška pri brisanju dokumenta' },
      { status: 500 }
    )
  }
}
