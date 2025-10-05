import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/users/notifications
 * Get user notification settings
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

    // Get user notification settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        notificationSettings: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Parse notification settings or use defaults
    let notificationSettings = {
      email: {
        caseUpdates: true,
        deadlineReminders: true,
        newDocuments: true,
        paymentReminders: true
      },
      push: {
        caseUpdates: true,
        deadlineReminders: true,
        newDocuments: false,
        paymentReminders: true
      }
    };

    if (user.notificationSettings) {
      try {
        const parsed = JSON.parse(user.notificationSettings);
        notificationSettings = { ...notificationSettings, ...parsed };
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
    }

    return NextResponse.json(notificationSettings);

  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju postavki obavještenja' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/notifications
 * Update user notification settings
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
    const { email, push } = body;

    // Validate input
    if (!email && !push) {
      return NextResponse.json(
        { error: 'Morate poslati postavke za email ili push obavještenja' },
        { status: 400 }
      );
    }

    // Get current notification settings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        notificationSettings: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Parse current settings or use defaults
    let currentSettings = {
      email: {
        caseUpdates: true,
        deadlineReminders: true,
        newDocuments: true,
        paymentReminders: true
      },
      push: {
        caseUpdates: true,
        deadlineReminders: true,
        newDocuments: false,
        paymentReminders: true
      }
    };

    if (user.notificationSettings) {
      try {
        const parsed = JSON.parse(user.notificationSettings);
        currentSettings = { ...currentSettings, ...parsed };
      } catch (error) {
        console.error('Error parsing current notification settings:', error);
      }
    }

    // Update settings
    const updatedSettings = {
      ...currentSettings,
      ...(email && { email }),
      ...(push && { push })
    };

    // Validate email settings
    if (email) {
      const validEmailKeys = ['caseUpdates', 'deadlineReminders', 'newDocuments', 'paymentReminders'];
      for (const key of validEmailKeys) {
        if (email[key] !== undefined && typeof email[key] !== 'boolean') {
          return NextResponse.json(
            { error: `Neispravna vrijednost za ${key}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate push settings
    if (push) {
      const validPushKeys = ['caseUpdates', 'deadlineReminders', 'newDocuments', 'paymentReminders'];
      for (const key of validPushKeys) {
        if (push[key] !== undefined && typeof push[key] !== 'boolean') {
          return NextResponse.json(
            { error: `Neispravna vrijednost za ${key}` },
            { status: 400 }
          );
        }
      }
    }

    // Update user notification settings
    await db.user.update({
      where: { id: session.user.id },
      data: {
        notificationSettings: JSON.stringify(updatedSettings),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Postavke obavještenja su uspješno ažurirane'
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju postavki obavještenja' },
      { status: 500 }
    );
  }
}
