import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/auth/me
 * Get current user data
 */
export async function GET(request: NextRequest) {
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
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        backupCodes: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Parse backup codes if they exist
    let backupCodes: string[] | null = null;
    if (user.backupCodes) {
      try {
        backupCodes = JSON.parse(user.backupCodes);
      } catch (error) {
        console.error('Error parsing backup codes:', error);
      }
    }

    return NextResponse.json({
      ...user,
      backupCodes
    });

  } catch (error) {
    console.error('Get user data error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju podataka korisnika' },
      { status: 500 }
    );
  }
}
