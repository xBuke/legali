import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/subscription'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe nije konfigurisan' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { tier } = body

    // Validate subscription tier
    if (!tier || !['BASIC', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json(
        { error: 'Neispravan plan pretplate' },
        { status: 400 }
      )
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Aktivna pretplata nije pronađena' },
        { status: 404 }
      )
    }

    const organization = user.organization
    const newTier = tier as SubscriptionTier
    const newPriceId = STRIPE_PRICE_IDS[newTier]

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(organization.stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate the change
      metadata: {
        organizationId: organization.id,
        subscriptionTier: newTier,
      },
    })

    // Update organization in database
    const newPlan = SUBSCRIPTION_PLANS[newTier]
    await db.organization.update({
      where: { id: organization.id },
      data: {
        subscriptionTier: newTier,
        subscriptionStatus: updatedSubscription.status === 'active' ? 'ACTIVE' : 
                           updatedSubscription.status === 'past_due' ? 'PAST_DUE' :
                           updatedSubscription.status === 'canceled' ? 'CANCELLED' : 'INCOMPLETE',
        subscriptionEndsAt: new Date(updatedSubscription.current_period_end * 1000),
        storageLimit: newPlan.limits.storage,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Pretplata je uspješno promijenjena na ${newPlan.name}`,
      subscription: {
        tier: newTier,
        status: updatedSubscription.status,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      }
    })

  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'Greška pri promjeni pretplate' },
      { status: 500 }
    )
  }
}
