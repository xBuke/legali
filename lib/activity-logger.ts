import { db } from './db';

interface CreateActivityLogProps {
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  organizationId: string;
  changes?: string; // JSON string of changes
  ipAddress?: string;
  userAgent?: string;
}

export async function createActivityLog({
  action,
  entity,
  entityId,
  userId,
  organizationId,
  changes,
  ipAddress,
  userAgent,
}: CreateActivityLogProps) {
  try {
    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        organizationId,
        changes,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Optionally, implement a more robust error handling for logging failures
  }
}