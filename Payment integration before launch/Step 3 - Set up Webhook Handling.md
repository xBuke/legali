# Step 3: Set up Webhook Handling

## Objective
Set up comprehensive webhook handling to process payment events and updates from Stripe, ensuring that the iLegal application stays in sync with payment statuses, subscription changes, and billing events in real-time.

## Prerequisites
- Stripe account configured (from Step 1)
- Webhook endpoint created in Stripe Dashboard
- Webhook secret obtained and stored in environment variables
- Basic understanding of Stripe webhook events

## Implementation Overview

This step involves creating a robust webhook handler that processes all relevant Stripe events and updates the application state accordingly. The webhook handler must be secure, reliable, and handle all edge cases.

## Tasks

### Task 1: Enhanced Webhook Handler

**File**: `app/api/webhooks/stripe/route.ts`

```typescript
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/subscription'
import { logActivity } from '@/lib/activity-logger'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  if (!stripe) {
    console.error('Stripe not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  console.log(`Processing webhook event: ${event.type}`)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice)
        break

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error processing webhook:', err)
    
    // Log the error for debugging
    await logActivity({
      type: 'WEBHOOK_ERROR',
      description: `Failed to process webhook event: ${event.type}`,
      metadata: {
        eventId: event.id,
        eventType: event.type,
        error: err.message,
        stack: err.stack
      }
    })

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Subscription Event Handlers

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id)
  
  const subscriptionTier = getSubscriptionTierFromSubscription(subscription)
  const plan = SUBSCRIPTION_PLANS[subscriptionTier]
  
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: subscription.customer as string }
  })

  if (!organization) {
    console.error('Organization not found for customer:', subscription.customer)
    return
  }

  await db.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionTier,
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'INCOMPLETE',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
      storageLimit: plan.limits.storage,
    },
  })

  // Log activity
  await logActivity({
    type: 'SUBSCRIPTION_CREATED',
    organizationId: organization.id,
    description: `Subscription created: ${subscriptionTier} plan`,
    metadata: {
      subscriptionId: subscription.id,
      tier: subscriptionTier,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  })

  console.log('Subscription created successfully for organization:', organization.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)
  
  const subscriptionTier = getSubscriptionTierFromSubscription(subscription)
  const plan = SUBSCRIPTION_PLANS[subscriptionTier]
  
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: subscription.customer as string }
  })

  if (!organization) {
    console.error('Organization not found for customer:', subscription.customer)
    return
  }

  const previousTier = organization.subscriptionTier
  const previousStatus = organization.subscriptionStatus

  await db.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionTier,
      subscriptionStatus: mapStripeStatusToAppStatus(subscription.status),
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      storageLimit: plan.limits.storage,
    },
  })

  // Log activity if tier or status changed
  if (previousTier !== subscriptionTier || previousStatus !== mapStripeStatusToAppStatus(subscription.status)) {
    await logActivity({
      type: 'SUBSCRIPTION_UPDATED',
      organizationId: organization.id,
      description: `Subscription updated: ${previousTier} → ${subscriptionTier}, ${previousStatus} → ${mapStripeStatusToAppStatus(subscription.status)}`,
      metadata: {
        subscriptionId: subscription.id,
        previousTier,
        newTier: subscriptionTier,
        previousStatus,
        newStatus: mapStripeStatusToAppStatus(subscription.status),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    })
  }

  console.log('Subscription updated successfully for organization:', organization.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)
  
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: subscription.customer as string }
  })

  if (!organization) {
    console.error('Organization not found for customer:', subscription.customer)
    return
  }

  await db.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionStatus: 'CANCELLED',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: null,
    },
  })

  // Log activity
  await logActivity({
    type: 'SUBSCRIPTION_CANCELLED',
    organizationId: organization.id,
    description: 'Subscription cancelled',
    metadata: {
      subscriptionId: subscription.id,
      cancelledAt: new Date(subscription.canceled_at! * 1000),
      cancelReason: subscription.cancellation_details?.reason
    }
  })

  console.log('Subscription cancelled successfully for organization:', organization.id)
}

// Payment Event Handlers

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!organization) {
    console.error('Organization not found for subscription:', invoice.subscription)
    return
  }

  await db.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionStatus: 'ACTIVE',
    },
  })

  // Log activity
  await logActivity({
    type: 'PAYMENT_SUCCEEDED',
    organizationId: organization.id,
    description: `Payment succeeded: €${(invoice.amount_paid / 100).toFixed(2)}`,
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      subscriptionId: invoice.subscription
    }
  })

  console.log('Payment succeeded processed for organization:', organization.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!organization) {
    console.error('Organization not found for subscription:', invoice.subscription)
    return
  }

  await db.organization.update({
    where: { id: organization.id },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  })

  // Log activity
  await logActivity({
    type: 'PAYMENT_FAILED',
    organizationId: organization.id,
    description: `Payment failed: €${(invoice.amount_due / 100).toFixed(2)}`,
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      subscriptionId: invoice.subscription,
      failureReason: invoice.last_finalization_error?.message
    }
  })

  console.log('Payment failed processed for organization:', organization.id)
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log('Processing payment action required:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!organization) {
    console.error('Organization not found for subscription:', invoice.subscription)
    return
  }

  // Log activity
  await logActivity({
    type: 'PAYMENT_ACTION_REQUIRED',
    organizationId: organization.id,
    description: 'Payment requires customer action (e.g., 3D Secure)',
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      subscriptionId: invoice.subscription,
      hostedInvoiceUrl: invoice.hosted_invoice_url
    }
  })

  console.log('Payment action required processed for organization:', organization.id)
}

// Checkout Event Handlers

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completed:', session.id)
  
  if (!session.customer) {
    console.log('No customer in checkout session, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: session.customer as string }
  })

  if (!organization) {
    console.error('Organization not found for customer:', session.customer)
    return
  }

  // Log activity
  await logActivity({
    type: 'CHECKOUT_COMPLETED',
    organizationId: organization.id,
    description: 'Checkout session completed successfully',
    metadata: {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
      amountTotal: session.amount_total,
      currency: session.currency
    }
  })

  console.log('Checkout completed processed for organization:', organization.id)
}

// Customer Event Handlers

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Processing customer created:', customer.id)
  
  // Log activity if we can find the organization
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: customer.id }
  })

  if (organization) {
    await logActivity({
      type: 'CUSTOMER_CREATED',
      organizationId: organization.id,
      description: 'Stripe customer created',
      metadata: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    })
  }

  console.log('Customer created processed:', customer.id)
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Processing customer updated:', customer.id)
  
  // Log activity if we can find the organization
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: customer.id }
  })

  if (organization) {
    await logActivity({
      type: 'CUSTOMER_UPDATED',
      organizationId: organization.id,
      description: 'Stripe customer updated',
      metadata: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    })
  }

  console.log('Customer updated processed:', customer.id)
}

// Invoice Event Handlers

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log('Processing invoice created:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!organization) {
    console.error('Organization not found for subscription:', invoice.subscription)
    return
  }

  // Log activity
  await logActivity({
    type: 'INVOICE_CREATED',
    organizationId: organization.id,
    description: `Invoice created: €${(invoice.amount_due / 100).toFixed(2)}`,
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      subscriptionId: invoice.subscription,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null
    }
  })

  console.log('Invoice created processed for organization:', organization.id)
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log('Processing invoice finalized:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription, skipping')
    return
  }

  const organization = await db.organization.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!organization) {
    console.error('Organization not found for subscription:', invoice.subscription)
    return
  }

  // Log activity
  await logActivity({
    type: 'INVOICE_FINALIZED',
    organizationId: organization.id,
    description: `Invoice finalized: €${(invoice.amount_due / 100).toFixed(2)}`,
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      subscriptionId: invoice.subscription,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url
    }
  })

  console.log('Invoice finalized processed for organization:', organization.id)
}

// Payment Intent Event Handlers

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment intent succeeded:', paymentIntent.id)
  
  // Log activity if we can find the organization
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string }
  })

  if (organization) {
    await logActivity({
      type: 'PAYMENT_INTENT_SUCCEEDED',
      organizationId: organization.id,
      description: `Payment intent succeeded: €${(paymentIntent.amount / 100).toFixed(2)}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customerId: paymentIntent.customer
      }
    })
  }

  console.log('Payment intent succeeded processed:', paymentIntent.id)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment intent failed:', paymentIntent.id)
  
  // Log activity if we can find the organization
  const organization = await db.organization.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string }
  })

  if (organization) {
    await logActivity({
      type: 'PAYMENT_INTENT_FAILED',
      organizationId: organization.id,
      description: `Payment intent failed: €${(paymentIntent.amount / 100).toFixed(2)}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customerId: paymentIntent.customer,
        failureReason: paymentIntent.last_payment_error?.message
      }
    })
  }

  console.log('Payment intent failed processed:', paymentIntent.id)
}

// Helper Functions

function getSubscriptionTierFromSubscription(subscription: Stripe.Subscription): SubscriptionTier {
  // First try to get from metadata
  if (subscription.metadata?.subscriptionTier) {
    return subscription.metadata.subscriptionTier as SubscriptionTier
  }

  // Fallback to determining from price ID
  if (subscription.items?.data?.[0]?.price?.id) {
    const priceId = subscription.items.data[0].price.id
    if (priceId.includes('basic') || priceId.includes('147')) return 'BASIC'
    if (priceId.includes('pro') || priceId.includes('297')) return 'PRO'
    if (priceId.includes('enterprise') || priceId.includes('497')) return 'ENTERPRISE'
  }

  // Default fallback
  return 'BASIC'
}

function mapStripeStatusToAppStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
    case 'cancelled':
      return 'CANCELLED'
    case 'incomplete':
      return 'INCOMPLETE'
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED'
    case 'trialing':
      return 'TRIALING'
    case 'unpaid':
      return 'UNPAID'
    default:
      return 'INCOMPLETE'
  }
}
```

### Task 2: Webhook Security Middleware

**File**: `lib/webhook-security.ts`

```typescript
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from './stripe'

export interface WebhookSecurityResult {
  isValid: boolean
  event?: Stripe.Event
  error?: string
}

export async function verifyWebhookSignature(
  req: NextRequest,
  webhookSecret: string
): Promise<WebhookSecurityResult> {
  try {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature')

    if (!signature) {
      return {
        isValid: false,
        error: 'Missing Stripe signature'
      }
    }

    if (!stripe) {
      return {
        isValid: false,
        error: 'Stripe not configured'
      }
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    return {
      isValid: true,
      event
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message
    }
  }
}

export function validateWebhookEvent(event: Stripe.Event): boolean {
  // Validate required fields
  if (!event.id || !event.type || !event.created) {
    return false
  }

  // Validate event age (prevent replay attacks)
  const eventAge = Date.now() - (event.created * 1000)
  const maxAge = 5 * 60 * 1000 // 5 minutes

  if (eventAge > maxAge) {
    console.warn(`Webhook event is too old: ${eventAge}ms`)
    return false
  }

  return true
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return secret
}
```

### Task 3: Webhook Event Logger

**File**: `lib/webhook-logger.ts`

```typescript
import { db } from './db'

export interface WebhookLog {
  eventId: string
  eventType: string
  processed: boolean
  error?: string
  organizationId?: string
  metadata?: any
  processedAt: Date
}

export async function logWebhookEvent(
  eventId: string,
  eventType: string,
  processed: boolean,
  error?: string,
  organizationId?: string,
  metadata?: any
): Promise<void> {
  try {
    await db.webhookLog.create({
      data: {
        eventId,
        eventType,
        processed,
        error,
        organizationId,
        metadata,
        processedAt: new Date()
      }
    })
  } catch (err) {
    console.error('Failed to log webhook event:', err)
  }
}

export async function getWebhookLogs(
  organizationId?: string,
  limit: number = 100
): Promise<WebhookLog[]> {
  try {
    const logs = await db.webhookLog.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { processedAt: 'desc' },
      take: limit
    })

    return logs.map(log => ({
      eventId: log.eventId,
      eventType: log.eventType,
      processed: log.processed,
      error: log.error || undefined,
      organizationId: log.organizationId || undefined,
      metadata: log.metadata,
      processedAt: log.processedAt
    }))
  } catch (err) {
    console.error('Failed to get webhook logs:', err)
    return []
  }
}
```

### Task 4: Database Schema for Webhook Logs

**File**: `prisma/schema.prisma`

Add the following model to track webhook events:

```prisma
model WebhookLog {
  id             String   @id @default(cuid())
  eventId        String   @unique
  eventType      String
  processed      Boolean  @default(false)
  error          String?
  organizationId String?
  metadata       Json?
  processedAt    DateTime @default(now())
  
  organization   Organization? @relation(fields: [organizationId], references: [id])
  
  @@map("webhook_logs")
}
```

### Task 5: Webhook Testing Endpoint

**File**: `app/api/webhooks/test/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { logWebhookEvent } from '@/lib/webhook-logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventType, customerId } = await req.json()

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Trigger test event
    const event = await stripe.events.create({
      type: eventType,
      data: {
        object: {
          id: `test_${Date.now()}`,
          customer: customerId,
          // Add other required fields based on event type
        }
      }
    })

    // Log the test event
    await logWebhookEvent(
      event.id,
      event.type,
      true,
      undefined,
      undefined,
      { testEvent: true }
    )

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventType: event.type
    })

  } catch (error: any) {
    console.error('Error creating test webhook event:', error)
    return NextResponse.json(
      { error: 'Failed to create test event' },
      { status: 500 }
    )
  }
}
```

### Task 6: Webhook Monitoring Dashboard

**File**: `app/dashboard/webhooks/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface WebhookLog {
  eventId: string
  eventType: string
  processed: boolean
  error?: string
  organizationId?: string
  metadata?: any
  processedAt: string
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/webhooks/logs')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getStatusIcon = (processed: boolean, error?: string) => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (processed) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (processed: boolean, error?: string) => {
    if (error) return <Badge variant="destructive">Failed</Badge>
    if (processed) return <Badge variant="default">Processed</Badge>
    return <Badge variant="secondary">Pending</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Events</h1>
          <p className="text-muted-foreground">
            Monitor Stripe webhook events and their processing status
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Latest webhook events from Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.eventId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(log.processed, log.error)}
                  <div>
                    <div className="font-medium">{log.eventType}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.eventId} • {new Date(log.processedAt).toLocaleString()}
                    </div>
                    {log.error && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(log.processed, log.error)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Testing the Webhook Implementation

### 1. Test with Stripe CLI

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger checkout.session.completed
```

### 2. Test Webhook Security

```bash
# Test with invalid signature
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_signature" \
  -d '{"test": "data"}'
```

### 3. Test Error Handling

```bash
# Test with malformed JSON
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: valid_signature" \
  -d 'invalid json'
```

## Error Handling and Retry Logic

### 1. Implement Idempotency

```typescript
// In webhook handler, check if event was already processed
const existingLog = await db.webhookLog.findUnique({
  where: { eventId: event.id }
})

if (existingLog && existingLog.processed) {
  console.log(`Event ${event.id} already processed, skipping`)
  return NextResponse.json({ received: true })
}
```

### 2. Implement Retry Logic

```typescript
// Retry failed webhook processing
export async function retryFailedWebhooks() {
  const failedLogs = await db.webhookLog.findMany({
    where: {
      processed: false,
      processedAt: {
        lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      }
    }
  })

  for (const log of failedLogs) {
    try {
      // Reprocess the webhook event
      await processWebhookEvent(log.eventId, log.eventType, log.metadata)
      
      await db.webhookLog.update({
        where: { id: log.id },
        data: { processed: true, error: null }
      })
    } catch (error) {
      console.error(`Failed to retry webhook ${log.eventId}:`, error)
    }
  }
}
```

## Security Best Practices

1. **Signature Verification**
   - Always verify webhook signatures
   - Use the correct webhook secret
   - Reject events with invalid signatures

2. **Event Validation**
   - Validate event structure and required fields
   - Check event age to prevent replay attacks
   - Implement idempotency checks

3. **Error Handling**
   - Log all webhook processing attempts
   - Don't expose sensitive information in error responses
   - Implement proper retry mechanisms

4. **Monitoring**
   - Monitor webhook processing success rates
   - Set up alerts for failed webhook processing
   - Track webhook event volumes

## Notes
- Ensure that webhook handlers are secure and validate incoming webhook events to prevent unauthorized access
- Log all webhook events for debugging and monitoring purposes
- Implement proper error handling and retry logic for failed webhook processing
- Monitor webhook processing performance and set up alerts for failures
- Test webhook handling thoroughly with various Stripe events

## Next Steps
After completing this step, proceed to Step 4: Test Payment Flows and Integration.