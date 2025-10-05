import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/subscription';

/**
 * GET /api/organizations/subscription
 * Get organization subscription information
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

    // If no organizationId in session, get it from the user
    let organizationId = session.user.organizationId;
    
    if (!organizationId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'Korisnik nije pronađen' },
          { status: 404 }
        );
      }
      
      organizationId = user.organizationId;
    }

    // Get organization subscription data
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        storageUsed: true,
        storageLimit: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organizacija nije pronađena' },
        { status: 404 }
      );
    }

    // Get current subscription plan details
    const currentPlan = SUBSCRIPTION_PLANS[organization.subscriptionTier as SubscriptionTier];
    
    // Calculate storage usage percentage
    const storageUsagePercentage = organization.storageLimit > 0 
      ? Math.round((Number(organization.storageUsed) / Number(organization.storageLimit)) * 100)
      : 0;

    // Format storage sizes
    const formatBytes = (bytes: bigint) => {
      const size = Number(bytes);
      if (size === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(size) / Math.log(k));
      return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Check if trial is active
    const isTrialActive = organization.subscriptionStatus === 'TRIAL' && 
      organization.trialEndsAt && 
      new Date(organization.trialEndsAt) > new Date();

    // Calculate days remaining in trial
    const trialDaysRemaining = isTrialActive && organization.trialEndsAt
      ? Math.ceil((new Date(organization.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        subscriptionTier: organization.subscriptionTier,
        subscriptionStatus: organization.subscriptionStatus,
        trialEndsAt: organization.trialEndsAt,
        subscriptionEndsAt: organization.subscriptionEndsAt,
        storageUsed: organization.storageUsed,
        storageLimit: organization.storageLimit,
        userCount: organization._count.users,
        isTrialActive,
        trialDaysRemaining,
      },
      currentPlan: {
        ...currentPlan,
        storageUsedFormatted: formatBytes(organization.storageUsed),
        storageLimitFormatted: formatBytes(organization.storageLimit),
        storageUsagePercentage,
      },
      availablePlans: Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => ({
        tier,
        ...plan,
        isCurrentPlan: tier === organization.subscriptionTier,
      })),
    });

  } catch (error) {
    console.error('Get subscription data error:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju podataka o pretplati' },
      { status: 500 }
    );
  }
}
