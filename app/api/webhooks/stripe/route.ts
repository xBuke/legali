import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/subscription'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
    }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Get subscription tier from metadata or price
        let subscriptionTier: SubscriptionTier = 'BASIC'
        if (subscription.metadata?.subscriptionTier) {
          subscriptionTier = subscription.metadata.subscriptionTier as SubscriptionTier
        } else if (subscription.items?.data?.[0]?.price?.id) {
          // Determine tier from price ID
          const priceId = subscription.items.data[0].price.id
          if (priceId.includes('basic') || priceId.includes('147')) subscriptionTier = 'BASIC'
          else if (priceId.includes('pro') || priceId.includes('297')) subscriptionTier = 'PRO'
          else if (priceId.includes('enterprise') || priceId.includes('497')) subscriptionTier = 'ENTERPRISE'
        }

        const plan = SUBSCRIPTION_PLANS[subscriptionTier]
        
        await db.organization.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionTier,
            subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 
                               subscription.status === 'past_due' ? 'PAST_DUE' :
                               subscription.status === 'canceled' ? 'CANCELLED' : 'INCOMPLETE',
            subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
            stripeSubscriptionId: subscription.id,
            storageLimit: plan.limits.storage,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await db.organization.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            subscriptionStatus: 'CANCELLED',
            subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Update organization subscription status if needed
        if (invoice.subscription) {
          await db.organization.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              subscriptionStatus: 'ACTIVE',
            },
          })
        }
        
        console.log('Payment succeeded for invoice:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Update organization subscription status
        if (invoice.subscription) {
          await db.organization.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              subscriptionStatus: 'PAST_DUE',
            },
          })
        }
        
        console.log('Payment failed for invoice:', invoice.id)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // This event is fired when a checkout session is completed
        // The subscription will be created/updated via the subscription events
        console.log('Checkout session completed:', session.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
  } catch (err: any) {
    console.error('Error in webhook handler:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
