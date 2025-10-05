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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { tier } = body;

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

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organizacija nije pronađena' },
        { status: 404 }
      )
    }

    const organization = user.organization
    const subscriptionTier = tier as SubscriptionTier
    const plan = SUBSCRIPTION_PLANS[subscriptionTier]
    const priceId = STRIPE_PRICE_IDS[subscriptionTier]

    // Create or get Stripe customer
    let customerId = organization.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          organizationId: organization.id,
          userId: user.id,
        },
      })
      customerId = customer.id

      // Update organization with Stripe customer ID
      await db.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?success=true&tier=${subscriptionTier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?canceled=true`,
      metadata: {
        organizationId: organization.id,
        userId: user.id,
        subscriptionTier: subscriptionTier,
      },
      subscription_data: {
        metadata: {
          organizationId: organization.id,
          subscriptionTier: subscriptionTier,
        },
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Greška pri kreiranju sesije za plaćanje' },
      { status: 500 }
    )
  }
}
