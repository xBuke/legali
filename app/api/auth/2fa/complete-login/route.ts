import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuthActivity } from '@/lib/activity-logger';

/**
 * POST /api/auth/2fa/complete-login
 * Complete login after 2FA verification
 */
export async function POST(request: NextRequest) {
  try {
    const { email, sessionId } = await request.json();

    if (!email || !sessionId) {
      return NextResponse.json(
        { error: 'Email i session ID su obavezni' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Vaš račun je deaktiviran' },
        { status: 401 }
      );
    }

    // Log successful login with 2FA
    await logAuthActivity(
      'LOGIN',
      user.id,
      user.organizationId,
      { 
        email, 
        twoFactorUsed: true,
        sessionId: sessionId.substring(0, 8) + '****'
      },
      request
    );

    // Return user data for session creation
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

  } catch (error) {
    console.error('Complete login error:', error);
    return NextResponse.json(
      { error: 'Greška pri dovršavanju prijave' },
      { status: 500 }
    );
  }
}

