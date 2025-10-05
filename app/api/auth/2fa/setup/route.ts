import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { setupTwoFactor } from '@/lib/two-factor';
import { logActivity } from '@/lib/activity-logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code for user setup
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
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Dvofaktorska autentifikacija je već omogućena' },
        { status: 400 }
      );
    }

    // Setup 2FA
    const twoFactorSetup = await setupTwoFactor(
      user.email,
      user.organization.name
    );

    // Update user with 2FA secret and backup codes
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: twoFactorSetup.secret,
        backupCodes: JSON.stringify(twoFactorSetup.backupCodes)
      }
    });

    // Log activity
    await logActivity({
      action: '2FA_SETUP_INITIATED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      request
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: twoFactorSetup.secret,
        qrCodeUrl: twoFactorSetup.qrCodeUrl,
        backupCodes: twoFactorSetup.backupCodes
      }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Greška pri postavljanju 2FA' },
      { status: 500 }
    );
  }
}
