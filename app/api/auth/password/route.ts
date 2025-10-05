import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/auth/password
 * Change user password
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
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Trenutna i nova lozinka su obavezne' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Nova lozinka mora imati najmanje 8 znakova' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Korisnik nema postavljenu lozinku' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Trenutna lozinka nije ispravna' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lozinka je uspješno promijenjena'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Greška pri promjeni lozinke' },
      { status: 500 }
    );
  }
}
