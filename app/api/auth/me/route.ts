import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current user data
 */
export async function GET(_request: NextRequest) {
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

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    // Validate input
    if (firstName && typeof firstName !== 'string') {
      return NextResponse.json(
        { error: 'Ime mora biti tekst' },
        { status: 400 }
      );
    }

    if (lastName && typeof lastName !== 'string') {
      return NextResponse.json(
        { error: 'Prezime mora biti tekst' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
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

    return NextResponse.json({
      ...updatedUser,
      backupCodes: updatedUser.backupCodes ? JSON.parse(updatedUser.backupCodes) : null
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju profila' },
      { status: 500 }
    );
  }
}
