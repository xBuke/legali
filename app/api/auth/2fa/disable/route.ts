import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyTwoFactorCode, validateTwoFactorCode } from '@/lib/two-factor';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for a user (requires verification)
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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Kod je obavezan za onemogućavanje 2FA' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!validateTwoFactorCode(code)) {
      return NextResponse.json(
        { error: 'Neispravan format koda' },
        { status: 400 }
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

    // Parse backup codes
    let backupCodes: string[] = [];
    try {
      backupCodes = user.backupCodes ? JSON.parse(user.backupCodes) : [];
    } catch (error) {
      console.error('Error parsing backup codes:', error);
      backupCodes = [];
    }

    // Verify 2FA code before disabling
    const verification = verifyTwoFactorCode(
      user.twoFactorSecret!,
      backupCodes,
      code
    );

    if (!verification.isValid) {
      // Log failed attempt
      await logActivity({
        action: '2FA_DISABLE_VERIFICATION_FAILED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        organizationId: user.organizationId,
        changes: JSON.stringify({ code: code.substring(0, 2) + '****' }),
        request
      });

      return NextResponse.json(
        { error: 'Neispravan kod' },
        { status: 400 }
      );
    }

    // Disable 2FA
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        twoFactorVerifiedAt: null
      }
    });

    // Log successful disable
    await logActivity({
      action: '2FA_DISABLED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      request
    });

    return NextResponse.json({
      success: true,
      message: '2FA je uspješno onemogućena'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Greška pri onemogućavanju 2FA' },
      { status: 500 }
    );
  }
}
