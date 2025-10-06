import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifyTwoFactorCode, validateTwoFactorCode } from '@/lib/two-factor';
import { logAuthActivity } from '@/lib/activity-logger';
import { validateRequiredEnvironment } from '@/lib/env-validation';
import crypto from 'crypto';

/**
 * POST /api/auth/custom-login
 * Custom login endpoint that handles 2FA flow
 */
export async function POST(request: NextRequest) {
  try {
    // Validate environment before processing
    try {
      validateRequiredEnvironment();
    } catch (envError) {
      console.error('Environment validation failed in custom-login:', envError instanceof Error ? envError.message : String(envError));
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { email, password, twoFactorCode, sessionId } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i lozinka su obavezni' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.password) {
      await logAuthActivity(
        'LOGIN_FAILED',
        'unknown',
        'unknown',
        { email, reason: 'User not found' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

    // Verify password
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      await logAuthActivity(
        'LOGIN_FAILED',
        user.id,
        user.organizationId,
        { email, reason: 'Invalid password' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Vaš račun je deaktiviran' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // If 2FA code is provided, verify it
      if (twoFactorCode) {
        if (!validateTwoFactorCode(twoFactorCode)) {
          await logAuthActivity(
            'LOGIN_FAILED',
            user.id,
            user.organizationId,
            { email, reason: 'Invalid 2FA code format' },
            request
          );
          return NextResponse.json(
            { error: 'Neispravan format 2FA koda' },
            { status: 400 }
          );
        }

        // Parse backup codes
        let backupCodes: string[] = [];
        try {
          backupCodes = user.backupCodes ? JSON.parse(user.backupCodes) : [];
        } catch (error) {
          console.error('Error parsing backup codes:', error);
        }

        // Verify 2FA code
        const verification = verifyTwoFactorCode(
          user.twoFactorSecret!,
          backupCodes,
          twoFactorCode
        );

        if (!verification.isValid) {
          await logAuthActivity(
            'LOGIN_FAILED',
            user.id,
            user.organizationId,
            { email, reason: 'Invalid 2FA code' },
            request
          );
          return NextResponse.json(
            { error: 'Neispravan 2FA kod' },
            { status: 401 }
          );
        }

        // If backup code was used, update the user's backup codes
        if (verification.isBackupCode) {
          await db.user.update({
            where: { id: user.id },
            data: {
              backupCodes: JSON.stringify(backupCodes)
            }
          });
        }

        // Log successful login with 2FA
        await logAuthActivity(
          'LOGIN',
          user.id,
          user.organizationId,
          { 
            email, 
            twoFactorUsed: true,
            isBackupCode: verification.isBackupCode
          },
          request
        );

        // Return success with user data
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
        // 2FA is enabled but no code provided - return session for 2FA verification
        const tempSessionId = crypto.randomBytes(32).toString('hex');
        
        // Store temporary session (in production, use Redis or similar)
        // For now, we'll return the session ID and let the client handle it
        
        return NextResponse.json({
          requires2FA: true,
          sessionId: tempSessionId,
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            organizationId: user.organizationId,
            role: user.role,
            twoFactorEnabled: true
          }
        });
      }
    } else {
      // No 2FA required - log successful login
      await logAuthActivity(
        'LOGIN',
        user.id,
        user.organizationId,
        { email, twoFactorUsed: false },
        request
      );

      // Return success with user data
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          organizationId: user.organizationId,
          role: user.role,
          twoFactorEnabled: false
        }
      });
    }

  } catch (error) {
    console.error('Custom login error:', error);
    return NextResponse.json(
      { error: 'Greška pri prijavi' },
      { status: 500 }
    );
  }
}

