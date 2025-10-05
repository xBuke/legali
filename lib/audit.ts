import { db } from './db'

interface AuditLogData {
  action: string
  entity: string
  entityId: string
  changes?: any
  userId?: string
  organizationId: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await db.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes,
        userId: data.userId,
        organizationId: data.organizationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging shouldn't break the main operation
  }
}

export function getClientIp(request: Request): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
