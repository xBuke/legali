import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get recent activities from audit logs
    const activities = await db.auditLog.findMany({
      where: {
        organizationId: user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Transform activities to match the interface
    const transformedActivities = activities.map((activity: Record<string, unknown>) => {
      let type: 'client_created' | 'case_opened' | 'document_uploaded' | 'invoice_sent' | 'payment_received' = 'client_created'
      let title = activity.description
      let relatedEntity = null

      // Determine activity type and create related entity info
      if (activity.entityType === 'Client') {
        type = 'client_created'
        title = `Novi klijent: ${activity.entityName}`
        relatedEntity = {
          type: 'client' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Case') {
        type = 'case_opened'
        title = `Novi predmet: ${activity.entityName}`
        relatedEntity = {
          type: 'case' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Document') {
        type = 'document_uploaded'
        title = `Dokument uploadan: ${activity.entityName}`
        relatedEntity = {
          type: 'document' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Invoice') {
        type = 'invoice_sent'
        title = `Račun poslan: ${activity.entityName}`
        relatedEntity = {
          type: 'invoice' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      }

      return {
        id: activity.id,
        type,
        title,
        description: activity.description,
        timestamp: activity.createdAt,
        user: `${activity.user.firstName} ${activity.user.lastName}`.trim() || activity.user.email,
        relatedEntity
      }
    })

    return NextResponse.json(transformedActivities)
  } catch (error) {
    console.error('Dashboard activities error:', error)
    
    // Return empty activities if there's an error
    return NextResponse.json([])
  }
}
