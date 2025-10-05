# Step 2: Implement Subscription Billing

## Objective
Implement comprehensive subscription billing functionality using Stripe to manage customer subscriptions, billing cycles, upgrades, downgrades, and cancellations for the iLegal application.

## Prerequisites
- Stripe account set up (from Step 1)
- API keys configured in environment variables
- Products and prices created in Stripe Dashboard
- Webhook endpoint configured

## Implementation Overview

This step involves creating several API endpoints and integrating Stripe's subscription management features into the iLegal application.

## Tasks

### Task 1: Create Checkout Session Endpoint

**File**: `app/api/billing/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { STRIPE_PRICE_IDS } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await req.json()
    
    if (!['BASIC', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let stripeCustomerId = user.organization.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.organization.name,
        metadata: {
          organizationId: user.organization.id,
          userId: user.id
        }
      })

      stripeCustomerId = customer.id

      // Update organization with Stripe customer ID
      await db.organization.update({
        where: { id: user.organization.id },
        data: { stripeCustomerId }
      })
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
      metadata: {
        organizationId: user.organization.id,
        subscriptionTier: tier
      },
      subscription_data: {
        metadata: {
          organizationId: user.organization.id,
          subscriptionTier: tier
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

### Task 2: Create Customer Portal Endpoint

**File**: `app/api/billing/portal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization?.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.organization.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings`,
    })

    return NextResponse.json({
      portalUrl: portalSession.url
    })

  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
```

### Task 3: Create Subscription Upgrade/Downgrade Endpoint

**File**: `app/api/billing/upgrade/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { STRIPE_PRICE_IDS } from '@/lib/stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await req.json()
    
    if (!['BASIC', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(
      user.organization.stripeSubscriptionId
    )

    // Get new price ID
    const newPriceId = STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS]

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(
      user.organization.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          organizationId: user.organization.id,
          subscriptionTier: tier
        }
      }
    )

    // Update organization in database
    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]
    await db.organization.update({
      where: { id: user.organization.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: updatedSubscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        subscriptionEndsAt: new Date(updatedSubscription.current_period_end * 1000),
        storageLimit: plan.limits.storage,
      }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        tier: tier,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
      }
    })

  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}
```

### Task 4: Create Subscription Status Endpoint

**File**: `app/api/billing/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org = user.organization

    // If no Stripe subscription, return free tier
    if (!org.stripeSubscriptionId) {
      return NextResponse.json({
        tier: 'FREE',
        status: 'ACTIVE',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        features: {
          maxCases: 5,
          maxUsers: 1,
          storageLimit: 1024 * 1024 * 1024, // 1GB
          hasAnalytics: false,
          hasAPI: false,
          hasPrioritySupport: false
        }
      })
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId)

    return NextResponse.json({
      tier: org.subscriptionTier,
      status: org.subscriptionStatus,
      currentPeriodEnd: org.subscriptionEndsAt,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: org.stripeSubscriptionId,
      features: {
        maxCases: org.subscriptionTier === 'BASIC' ? 50 : 
                  org.subscriptionTier === 'PRO' ? -1 : -1, // -1 = unlimited
        maxUsers: org.subscriptionTier === 'BASIC' ? 3 : 
                  org.subscriptionTier === 'PRO' ? 6 : -1,
        storageLimit: org.storageLimit,
        hasAnalytics: org.subscriptionTier !== 'BASIC',
        hasAPI: org.subscriptionTier !== 'BASIC',
        hasPrioritySupport: org.subscriptionTier === 'ENTERPRISE'
      }
    })

  } catch (error) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
```

### Task 5: Create Subscription Cancellation Endpoint

**File**: `app/api/billing/cancel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cancelAtPeriodEnd = true } = await req.json()

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.organization.stripeSubscriptionId,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
        metadata: {
          organizationId: user.organization.id,
          cancelledBy: user.id,
          cancelledAt: new Date().toISOString()
        }
      }
    )

    // Update organization status
    await db.organization.update({
      where: { id: user.organization.id },
      data: {
        subscriptionStatus: cancelAtPeriodEnd ? 'ACTIVE' : 'CANCELLED',
        subscriptionEndsAt: cancelAtPeriodEnd ? 
          new Date(subscription.current_period_end * 1000) : 
          new Date()
      }
    })

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
```

### Task 6: Create Invoice History Endpoint

**File**: `app/api/billing/invoices/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization?.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 })
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.organization.stripeCustomerId,
      limit: 50,
    })

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidAt: invoice.status_transitions?.paid_at ? 
        new Date(invoice.status_transitions.paid_at * 1000) : null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      subscriptionId: invoice.subscription
    }))

    return NextResponse.json({
      invoices: formattedInvoices,
      hasMore: invoices.has_more
    })

  } catch (error) {
    console.error('Error getting invoices:', error)
    return NextResponse.json(
      { error: 'Failed to get invoices' },
      { status: 500 }
    )
  }
}
```

### Task 7: Update Database Schema

**File**: `prisma/schema.prisma`

Add the following fields to the Organization model if not already present:

```prisma
model Organization {
  // ... existing fields ...
  
  // Stripe fields
  stripeCustomerId        String?   @unique
  stripeSubscriptionId    String?   @unique
  subscriptionTier        String    @default("FREE")
  subscriptionStatus      String    @default("ACTIVE")
  subscriptionEndsAt      DateTime?
  storageLimit            BigInt    @default(1073741824) // 1GB in bytes
  
  // ... rest of model ...
}
```

### Task 8: Create Subscription Utility Functions

**File**: `lib/subscription.ts`

```typescript
export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'

export interface SubscriptionPlan {
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  limits: {
    cases: number // -1 for unlimited
    users: number // -1 for unlimited
    storage: number // in bytes
  }
  features: {
    analytics: boolean
    api: boolean
    prioritySupport: boolean
    customWorkflows: boolean
    whiteLabel: boolean
  }
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    limits: {
      cases: 5,
      users: 1,
      storage: 1024 * 1024 * 1024, // 1GB
    },
    features: {
      analytics: false,
      api: false,
      prioritySupport: false,
      customWorkflows: false,
      whiteLabel: false,
    },
  },
  BASIC: {
    name: 'Basic',
    price: 147,
    currency: 'EUR',
    interval: 'month',
    limits: {
      cases: 50,
      users: 3,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    },
    features: {
      analytics: false,
      api: false,
      prioritySupport: false,
      customWorkflows: false,
      whiteLabel: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 297,
    currency: 'EUR',
    interval: 'month',
    limits: {
      cases: -1, // unlimited
      users: 6,
      storage: 100 * 1024 * 1024 * 1024, // 100GB
    },
    features: {
      analytics: true,
      api: true,
      prioritySupport: false,
      customWorkflows: true,
      whiteLabel: false,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 497,
    currency: 'EUR',
    interval: 'month',
    limits: {
      cases: -1, // unlimited
      users: -1, // unlimited
      storage: 1000 * 1024 * 1024 * 1024, // 1TB
    },
    features: {
      analytics: true,
      api: true,
      prioritySupport: true,
      customWorkflows: true,
      whiteLabel: true,
    },
  },
}

export function getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier]
}

export function canAccessFeature(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionPlan['features']
): boolean {
  const plan = getSubscriptionPlan(userTier)
  return plan.features[feature]
}

export function getUsageLimit(
  userTier: SubscriptionTier,
  resource: keyof SubscriptionPlan['limits']
): number {
  const plan = getSubscriptionPlan(userTier)
  return plan.limits[resource]
}
```

## Testing the Implementation

### 1. Test Checkout Flow
```bash
# Create a checkout session
curl -X POST http://localhost:3000/api/billing/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"tier": "PRO"}'
```

### 2. Test Customer Portal
```bash
# Create portal session
curl -X POST http://localhost:3000/api/billing/portal \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 3. Test Subscription Status
```bash
# Get subscription status
curl -X GET http://localhost:3000/api/billing/status \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 4. Test Upgrade/Downgrade
```bash
# Upgrade subscription
curl -X POST http://localhost:3000/api/billing/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"tier": "ENTERPRISE"}'
```

## Frontend Integration

### Create Billing Components

**File**: `components/billing/subscription-card.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface SubscriptionCardProps {
  tier: string
  price: number
  currency: string
  features: string[]
  isCurrentPlan?: boolean
  isPopular?: boolean
  onSelect: (tier: string) => void
  loading?: boolean
}

export function SubscriptionCard({
  tier,
  price,
  currency,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  loading = false
}: SubscriptionCardProps) {
  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{tier}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{currency} {price}</span>
          <span className="text-muted-foreground">/month</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={() => onSelect(tier)}
          disabled={isCurrentPlan || loading}
          className="w-full"
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {isCurrentPlan ? "Current Plan" : `Choose ${tier}`}
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Error Handling

### Common Error Scenarios

1. **Invalid Tier**
   - Return 400 Bad Request with clear error message
   - Validate tier against allowed values

2. **No Active Subscription**
   - Return 404 Not Found
   - Provide clear guidance on how to subscribe

3. **Stripe API Errors**
   - Log detailed error information
   - Return user-friendly error messages
   - Implement retry logic for transient errors

4. **Database Errors**
   - Handle constraint violations
   - Implement proper transaction handling
   - Rollback changes on failure

## Security Considerations

1. **Authentication**
   - Verify user session for all endpoints
   - Check user permissions for organization access

2. **Input Validation**
   - Validate all input parameters
   - Sanitize user input
   - Prevent injection attacks

3. **Rate Limiting**
   - Implement rate limiting for billing endpoints
   - Prevent abuse of subscription management

4. **Audit Logging**
   - Log all subscription changes
   - Track who made changes and when
   - Maintain audit trail for compliance

## Notes
- Ensure that the subscription billing logic is robust and handles edge cases such as failed payments and subscription renewals
- Test the subscription billing process thoroughly to ensure accuracy and reliability
- Implement proper error handling and user feedback for all billing operations
- Consider implementing usage tracking and billing alerts
- Plan for handling subscription renewals and payment failures

## Next Steps
After completing this step, proceed to Step 3: Set up Webhook Handling.