import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
// import { verifyTwoFactorCode, validateTwoFactorCode } from '@/lib/two-factor';
import { logAuthActivity } from '@/lib/activity-logger';
import { validateRequiredEnvironment } from '@/lib/env-validation';

/**
 * POST /api/auth/custom-login
 * Custom login endpoint with 2FA support (2FA temporarily disabled)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate environment
    validateRequiredEnvironment();

    const { email, password } = await request.json();

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

    if (!user) {
      await logAuthActivity(
        'LOGIN_FAILED',
        '',
        '',
        { email, reason: 'User not found' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password) {
      await logAuthActivity(
        'LOGIN_FAILED',
        user.id,
        user.organizationId,
        { email, reason: 'No password set' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

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

    // Check if user is active
    if (!user.isActive) {
      await logAuthActivity(
        'LOGIN_FAILED',
        user.id,
        user.organizationId,
        { email, reason: 'Account deactivated' },
        request
      );
      return NextResponse.json(
        { error: 'Vaš račun je deaktiviran' },
        { status: 401 }
      );
    }

    // 2FA functionality temporarily disabled - proceed with normal login
    // Log successful login
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

  } catch (error) {
    console.error('Custom login error:', error);
    return NextResponse.json(
      { error: 'Greška pri prijavi' },
      { status: 500 }
    );
  }
}