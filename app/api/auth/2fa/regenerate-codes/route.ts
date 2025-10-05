import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { regenerateBackupCodes } from '@/lib/two-factor';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/regenerate-codes
 * Regenerate backup codes for 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA nije omogućena' },
        { status: 400 }
      );
    }

    // Generate new backup codes
    const newBackupCodes = regenerateBackupCodes();

    // Update user with new backup codes
    await db.user.update({
      where: { id: user.id },
      data: {
        backupCodes: JSON.stringify(newBackupCodes)
      }
    });

    // Log activity
    await logActivity({
      action: '2FA_BACKUP_CODES_REGENERATED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      request
    });

    return NextResponse.json({
      success: true,
      data: {
        backupCodes: newBackupCodes
      }
    });

  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'Greška pri regeneriranju rezervnih kodova' },
      { status: 500 }
    );
  }
}
