import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations
 * Get current user's organization
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            subscriptionEndsAt: true,
            storageUsed: true,
            storageLimit: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Organizacija nije pronađena' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user.organization,
      storageUsed: user.organization.storageUsed.toString(),
      storageLimit: user.organization.storageLimit.toString(),
    });

  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju organizacije' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations
 * Update current user's organization
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
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Naziv organizacije je obavezan' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Naziv organizacije mora imati najmanje 2 znaka' },
        { status: 400 }
      );
    }

    // Get user's organization ID
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organizacija nije pronađena' },
        { status: 404 }
      );
    }

    // Update organization
    const updatedOrganization = await db.organization.update({
      where: { id: user.organizationId },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      organization: {
        ...updatedOrganization,
        storageUsed: updatedOrganization.storageUsed.toString(),
        storageLimit: updatedOrganization.storageLimit.toString(),
      },
      message: 'Organizacija je uspješno ažurirana'
    });

  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju organizacije' },
      { status: 500 }
    );
  }
}
