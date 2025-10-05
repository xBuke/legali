import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyTwoFactorCode, validateTwoFactorCode } from '@/lib/two-factor';
import { logActivity, logAuthActivity } from '@/lib/activity-logger';

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code (TOTP or backup code) - supports both session-based and login flow
 */
export async function POST(request: NextRequest) {
  try {
    const { code, sessionId, email } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Kod je obavezan' },
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

    let user;
    let userId;

    // Handle login flow (when sessionId and email are provided)
    if (sessionId && email) {
      user = await db.user.findUnique({
        where: { email },
        include: { organization: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'Korisnik nije pronađen' },
          { status: 404 }
        );
      }
      
      userId = user.id;
    } else {
      // Handle session-based verification (for existing users)
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Neautoriziran pristup' },
          { status: 401 }
        );
      }

      user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { organization: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'Korisnik nije pronađen' },
          { status: 404 }
        );
      }
      
      userId = user.id;
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA nije postavljena' },
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

    // Verify 2FA code
    const verification = verifyTwoFactorCode(
      user.twoFactorSecret,
      backupCodes,
      code
    );

    if (!verification.isValid) {
      // Log failed attempt
      await logActivity({
        action: '2FA_VERIFICATION_FAILED',
        entity: 'User',
        entityId: userId,
        userId: userId,
        organizationId: user.organizationId,
        request,
        changes: JSON.stringify({ code: code.substring(0, 2) + '****' })
      });

      return NextResponse.json(
        { error: 'Neispravan kod' },
        { status: 400 }
      );
    }

    // If backup code was used, update the user's backup codes
    if (verification.isBackupCode) {
      await db.user.update({
        where: { id: userId },
        data: {
          backupCodes: JSON.stringify(backupCodes)
        }
      });
    }

    // Enable 2FA if not already enabled (for setup flow)
    if (!user.twoFactorEnabled) {
      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorVerifiedAt: new Date()
        }
      });
    }

    // Log successful verification
    const action = verification.isBackupCode ? '2FA_BACKUP_CODE_USED' : '2FA_VERIFICATION_SUCCESS';
    
    if (sessionId && email) {
      // Login flow - log as auth activity
      await logAuthActivity(
        'LOGIN',
        userId,
        user.organizationId,
        { 
          email, 
          twoFactorUsed: true,
          isBackupCode: verification.isBackupCode
        },
        request
      );
    } else {
      // Session flow - log as regular activity
      await logActivity({
        action,
        entity: 'User',
        entityId: userId,
        userId: userId,
        organizationId: user.organizationId,
        request
      });
    }

    // Return appropriate response based on context
    if (sessionId && email) {
      // Login flow - return user data for session creation
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          organizationId: user.organizationId,
          role: user.role,
          twoFactorEnabled: true
        }
      });
    } else {
      // Session flow - return verification success
      return NextResponse.json({
        success: true,
        message: 'Kod je uspješno verificiran',
        data: {
          isBackupCode: verification.isBackupCode,
          twoFactorEnabled: true
        }
      });
    }

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Greška pri verifikaciji koda' },
      { status: 500 }
    );
  }
}
