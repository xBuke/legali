# Step 5: Configure Pricing Tiers

## Objective
Configure comprehensive pricing tiers for the iLegal application in Stripe to align with the business model, ensure accurate billing for each subscription level, and implement proper feature access controls based on subscription tiers.

## Prerequisites
- Stripe account configured (from Step 1)
- Products and basic prices created in Stripe Dashboard
- Subscription billing implemented (from Step 2)
- Webhook handling set up (from Step 3)
- Testing completed (from Step 4)

## Implementation Overview

This step involves:
- Configuring detailed pricing tiers in Stripe
- Setting up feature limitations and access controls
- Implementing tier-based functionality in the application
- Creating pricing management tools
- Setting up promotional pricing and discounts
- Configuring tax settings and compliance

## Tasks

### Task 1: Configure Stripe Products and Prices

#### 1.1 Create Detailed Products in Stripe Dashboard

**BASIC Plan Configuration:**
- **Product Name**: "iLegal Basic"
- **Description**: "Essential legal case management for small practices"
- **Price**: €147.00/month
- **Currency**: EUR
- **Billing Interval**: Monthly
- **Features**:
  - Up to 50 cases
  - Up to 3 users
  - 10GB storage
  - Basic document management
  - Time tracking
  - Client portal access
  - Email support
  - Basic reporting

**PRO Plan Configuration:**
- **Product Name**: "iLegal Pro"
- **Description**: "Advanced legal practice management for growing firms"
- **Price**: €297.00/month
- **Currency**: EUR
- **Billing Interval**: Monthly
- **Features**:
  - Unlimited cases
  - Up to 6 users
  - 100GB storage
  - Advanced document management
  - Advanced analytics and reporting
  - Custom workflows
  - API access
  - Priority support
  - Advanced time tracking
  - Client collaboration tools

**ENTERPRISE Plan Configuration:**
- **Product Name**: "iLegal Enterprise"
- **Description**: "Complete legal practice solution for large firms"
- **Price**: €497.00/month
- **Currency**: EUR
- **Billing Interval**: Monthly
- **Features**:
  - Everything in Pro
  - Unlimited users
  - 1TB storage
  - White-label options
  - Custom integrations
  - Dedicated account manager
  - SLA guarantees
  - Custom training
  - Advanced security features
  - Multi-location support

#### 1.2 Create Annual Pricing Options

**File**: `scripts/create-annual-pricing.js`

```javascript
const { stripe } = require('../lib/stripe')

async function createAnnualPricing() {
  console.log('Creating annual pricing options...')

  const annualDiscounts = {
    BASIC: 0.15, // 15% discount for annual
    PRO: 0.20,   // 20% discount for annual
    ENTERPRISE: 0.25 // 25% discount for annual
  }

  const monthlyPrices = {
    BASIC: 147,
    PRO: 297,
    ENTERPRISE: 497
  }

  for (const [tier, discount] of Object.entries(annualDiscounts)) {
    const monthlyPrice = monthlyPrices[tier]
    const annualPrice = Math.round(monthlyPrice * 12 * (1 - discount))

    // Create annual product
    const product = await stripe.products.create({
      name: `iLegal ${tier} (Annual)`,
      description: `Annual subscription for iLegal ${tier} plan with ${Math.round(discount * 100)}% discount`,
      metadata: {
        tier: tier,
        billing_interval: 'annual',
        discount_percentage: Math.round(discount * 100)
      }
    })

    // Create annual price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: annualPrice * 100, // Convert to cents
      currency: 'eur',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        tier: tier,
        billing_interval: 'annual',
        monthly_equivalent: monthlyPrice,
        discount_percentage: Math.round(discount * 100)
      }
    })

    console.log(`Created annual pricing for ${tier}: €${annualPrice}/year (€${Math.round(annualPrice/12)}/month equivalent)`)
    console.log(`Product ID: ${product.id}`)
    console.log(`Price ID: ${price.id}`)
    console.log('---')
  }
}

createAnnualPricing().catch(console.error)
```

### Task 2: Implement Feature Access Controls

#### 2.1 Create Subscription Limits Service

**File**: `lib/subscription-limits.ts`

```typescript
import { db } from './db'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from './subscription'

export interface UsageLimits {
  cases: {
    current: number
    limit: number
    unlimited: boolean
  }
  users: {
    current: number
    limit: number
    unlimited: boolean
  }
  storage: {
    current: number // in bytes
    limit: number // in bytes
    unlimited: boolean
  }
}

export interface FeatureAccess {
  analytics: boolean
  api: boolean
  prioritySupport: boolean
  customWorkflows: boolean
  whiteLabel: boolean
  advancedReporting: boolean
  clientCollaboration: boolean
  multiLocation: boolean
}

export async function getUsageLimits(organizationId: string): Promise<UsageLimits> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      cases: true,
      users: true
    }
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  const plan = SUBSCRIPTION_PLANS[organization.subscriptionTier as SubscriptionTier]

  // Get current usage
  const currentCases = organization.cases.length
  const currentUsers = organization.users.length
  const currentStorage = await getCurrentStorageUsage(organizationId)

  return {
    cases: {
      current: currentCases,
      limit: plan.limits.cases,
      unlimited: plan.limits.cases === -1
    },
    users: {
      current: currentUsers,
      limit: plan.limits.users,
      unlimited: plan.limits.users === -1
    },
    storage: {
      current: currentStorage,
      limit: plan.limits.storage,
      unlimited: plan.limits.storage === -1
    }
  }
}

export async function getFeatureAccess(organizationId: string): Promise<FeatureAccess> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId }
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  const plan = SUBSCRIPTION_PLANS[organization.subscriptionTier as SubscriptionTier]

  return {
    analytics: plan.features.analytics,
    api: plan.features.api,
    prioritySupport: plan.features.prioritySupport,
    customWorkflows: plan.features.customWorkflows,
    whiteLabel: plan.features.whiteLabel,
    advancedReporting: plan.features.analytics, // Same as analytics for now
    clientCollaboration: organization.subscriptionTier !== 'BASIC',
    multiLocation: organization.subscriptionTier === 'ENTERPRISE'
  }
}

export async function checkUsageLimit(
  organizationId: string,
  resource: 'cases' | 'users' | 'storage',
  additionalUsage: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; unlimited: boolean }> {
  const limits = await getUsageLimits(organizationId)
  const resourceLimit = limits[resource]

  if (resourceLimit.unlimited) {
    return {
      allowed: true,
      current: resourceLimit.current,
      limit: -1,
      unlimited: true
    }
  }

  const wouldExceed = resourceLimit.current + additionalUsage > resourceLimit.limit

  return {
    allowed: !wouldExceed,
    current: resourceLimit.current,
    limit: resourceLimit.limit,
    unlimited: false
  }
}

export async function checkFeatureAccess(
  organizationId: string,
  feature: keyof FeatureAccess
): Promise<boolean> {
  const access = await getFeatureAccess(organizationId)
  return access[feature]
}

async function getCurrentStorageUsage(organizationId: string): Promise<number> {
  // This would typically query your file storage system
  // For now, return a mock value
  const result = await db.$queryRaw`
    SELECT COALESCE(SUM(file_size), 0) as total_size
    FROM documents
    WHERE organization_id = ${organizationId}
  `
  
  return Number(result[0]?.total_size || 0)
}
```

#### 2.2 Create Usage Enforcement Middleware

**File**: `lib/usage-enforcement.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { checkUsageLimit, checkFeatureAccess } from './subscription-limits'
import { db } from './db'

export interface UsageEnforcementOptions {
  resource?: 'cases' | 'users' | 'storage'
  feature?: string
  additionalUsage?: number
}

export function withUsageEnforcement(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: UsageEnforcementOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
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

      // Check resource limits
      if (options.resource) {
        const limitCheck = await checkUsageLimit(
          user.organization.id,
          options.resource,
          options.additionalUsage || 1
        )

        if (!limitCheck.allowed) {
          return NextResponse.json({
            error: 'Usage limit exceeded',
            details: {
              resource: options.resource,
              current: limitCheck.current,
              limit: limitCheck.limit,
              unlimited: limitCheck.unlimited
            },
            upgradeRequired: true
          }, { status: 403 })
        }
      }

      // Check feature access
      if (options.feature) {
        const hasAccess = await checkFeatureAccess(
          user.organization.id,
          options.feature as any
        )

        if (!hasAccess) {
          return NextResponse.json({
            error: 'Feature not available in current plan',
            details: {
              feature: options.feature,
              currentPlan: user.organization.subscriptionTier
            },
            upgradeRequired: true
          }, { status: 403 })
        }
      }

      // If all checks pass, proceed with the original handler
      return await handler(req)

    } catch (error) {
      console.error('Usage enforcement error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
```

### Task 3: Create Pricing Management API

#### 3.1 Pricing Information Endpoint

**File**: `app/api/pricing/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeAnnual = searchParams.get('includeAnnual') === 'true'

    const pricing = {
      monthly: {},
      annual: {}
    }

    // Get monthly pricing
    for (const [tier, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (tier === 'FREE') continue

      pricing.monthly[tier] = {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits,
        popular: tier === 'PRO'
      }
    }

    // Get annual pricing if requested
    if (includeAnnual && stripe) {
      try {
        const products = await stripe.products.list({
          active: true,
          limit: 100
        })

        for (const product of products.data) {
          if (product.metadata?.billing_interval === 'annual') {
            const tier = product.metadata.tier
            const prices = await stripe.prices.list({
              product: product.id,
              active: true
            })

            if (prices.data.length > 0) {
              const price = prices.data[0]
              const monthlyPlan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

              pricing.annual[tier] = {
                name: `${monthlyPlan.name} (Annual)`,
                price: Math.round(price.unit_amount! / 100),
                currency: price.currency.toUpperCase(),
                interval: 'year',
                features: monthlyPlan.features,
                limits: monthlyPlan.limits,
                discount: product.metadata.discount_percentage,
                monthlyEquivalent: Math.round(price.unit_amount! / 100 / 12)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching annual pricing:', error)
      }
    }

    return NextResponse.json({
      pricing,
      currency: 'EUR',
      billingIntervals: ['monthly', 'annual']
    })

  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    )
  }
}
```

#### 3.2 Pricing Comparison Endpoint

**File**: `app/api/pricing/compare/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
    const comparison = Object.entries(SUBSCRIPTION_PLANS).map(([tier, plan]) => ({
      tier,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: {
        cases: plan.limits.cases === -1 ? 'Unlimited' : plan.limits.cases.toString(),
        users: plan.limits.users === -1 ? 'Unlimited' : plan.limits.users.toString(),
        storage: formatStorage(plan.limits.storage),
        analytics: plan.features.analytics,
        api: plan.features.api,
        prioritySupport: plan.features.prioritySupport,
        customWorkflows: plan.features.customWorkflows,
        whiteLabel: plan.features.whiteLabel
      },
      limits: plan.limits,
      featureFlags: plan.features
    }))

    return NextResponse.json({
      comparison,
      currency: 'EUR',
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creating pricing comparison:', error)
    return NextResponse.json(
      { error: 'Failed to create pricing comparison' },
      { status: 500 }
    )
  }
}

function formatStorage(bytes: number): string {
  if (bytes === -1) return 'Unlimited'
  
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)}TB`
  }
  return `${gb.toFixed(0)}GB`
}
```

### Task 4: Create Pricing Components

#### 4.1 Pricing Table Component

**File**: `components/pricing/pricing-table.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star } from 'lucide-react'

interface PricingPlan {
  tier: string
  name: string
  price: number
  currency: string
  interval: string
  features: {
    cases: string
    users: string
    storage: string
    analytics: boolean
    api: boolean
    prioritySupport: boolean
    customWorkflows: boolean
    whiteLabel: boolean
  }
  popular?: boolean
  discount?: number
  monthlyEquivalent?: number
}

interface PricingTableProps {
  currentPlan?: string
  onSelectPlan: (tier: string) => void
  loading?: boolean
}

export function PricingTable({ currentPlan, onSelectPlan, loading = false }: PricingTableProps) {
  const [pricing, setPricing] = useState<{ monthly: Record<string, PricingPlan>, annual: Record<string, PricingPlan> }>({ monthly: {}, annual: {} })
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPricing, setLoadingPricing] = useState(true)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing?includeAnnual=true')
      const data = await response.json()
      setPricing(data.pricing)
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
    } finally {
      setLoadingPricing(false)
    }
  }

  const currentPricing = pricing[billingInterval]
  const plans = Object.values(currentPricing)

  if (loadingPricing) {
    return <div className="flex justify-center p-8">Loading pricing...</div>
  }

  return (
    <div className="space-y-8">
      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            {billingInterval === 'annual' && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Save up to 25%
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.tier} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {plan.currency} {plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.interval === 'year' ? 'year' : 'month'}
                  </span>
                </div>
                {plan.monthlyEquivalent && (
                  <div className="text-sm text-muted-foreground">
                    €{plan.monthlyEquivalent}/month equivalent
                  </div>
                )}
                {plan.discount && (
                  <Badge variant="secondary" className="w-fit">
                    {plan.discount}% off
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span className="text-sm">
                    {plan.features.cases} cases
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span className="text-sm">
                    {plan.features.users} users
                  </span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span className="text-sm">
                    {plan.features.storage} storage
                  </span>
                </li>
                <li className="flex items-center">
                  {plan.features.analytics ? (
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-3" />
                  )}
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  {plan.features.api ? (
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-3" />
                  )}
                  <span className="text-sm">API access</span>
                </li>
                <li className="flex items-center">
                  {plan.features.prioritySupport ? (
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-3" />
                  )}
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-center">
                  {plan.features.customWorkflows ? (
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-3" />
                  )}
                  <span className="text-sm">Custom workflows</span>
                </li>
                <li className="flex items-center">
                  {plan.features.whiteLabel ? (
                    <Check className="h-4 w-4 text-green-500 mr-3" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 mr-3" />
                  )}
                  <span className="text-sm">White-label options</span>
                </li>
              </ul>
              
              <Button
                onClick={() => onSelectPlan(plan.tier)}
                disabled={currentPlan === plan.tier || loading}
                className="w-full"
                variant={currentPlan === plan.tier ? "outline" : "default"}
              >
                {currentPlan === plan.tier ? "Current Plan" : `Choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Task 5: Implement Usage Monitoring

#### 5.1 Usage Dashboard Component

**File**: `components/pricing/usage-dashboard.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, Users, FileText, HardDrive, AlertTriangle } from 'lucide-react'

interface UsageData {
  cases: {
    current: number
    limit: number
    unlimited: boolean
  }
  users: {
    current: number
    limit: number
    unlimited: boolean
  }
  storage: {
    current: number
    limit: number
    unlimited: boolean
  }
}

interface FeatureAccess {
  analytics: boolean
  api: boolean
  prioritySupport: boolean
  customWorkflows: boolean
  whiteLabel: boolean
}

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [features, setFeatures] = useState<FeatureAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const [usageResponse, featuresResponse] = await Promise.all([
        fetch('/api/usage/limits'),
        fetch('/api/usage/features')
      ])

      const usageData = await usageResponse.json()
      const featuresData = await featuresResponse.json()

      setUsage(usageData.usage)
      setFeatures(featuresData.features)
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatStorage = (bytes: number) => {
    if (bytes === -1) return 'Unlimited'
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)}TB`
    }
    return `${gb.toFixed(1)}GB`
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading usage data...</div>
  }

  if (!usage || !features) {
    return <div className="text-center p-8">Failed to load usage data</div>
  }

  const casesPercentage = getUsagePercentage(usage.cases.current, usage.cases.limit, usage.cases.unlimited)
  const usersPercentage = getUsagePercentage(usage.users.current, usage.users.limit, usage.users.unlimited)
  const storagePercentage = getUsagePercentage(usage.storage.current, usage.storage.limit, usage.storage.unlimited)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usage Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor your current usage and plan limits
        </p>
      </div>

      {/* Usage Alerts */}
      {(casesPercentage >= 90 || usersPercentage >= 90 || storagePercentage >= 90) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching your usage limits. Consider upgrading your plan to avoid service interruptions.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cases Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.cases.current}
              {!usage.cases.unlimited && ` / ${usage.cases.limit}`}
            </div>
            {!usage.cases.unlimited && (
              <>
                <Progress value={casesPercentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {casesPercentage.toFixed(1)}% of limit used
                </p>
              </>
            )}
            {usage.cases.unlimited && (
              <Badge variant="secondary" className="mt-2">Unlimited</Badge>
            )}
          </CardContent>
        </Card>

        {/* Users Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.users.current}
              {!usage.users.unlimited && ` / ${usage.users.limit}`}
            </div>
            {!usage.users.unlimited && (
              <>
                <Progress value={usersPercentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {usersPercentage.toFixed(1)}% of limit used
                </p>
              </>
            )}
            {usage.users.unlimited && (
              <Badge variant="secondary" className="mt-2">Unlimited</Badge>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatStorage(usage.storage.current)}
              {!usage.storage.unlimited && ` / ${formatStorage(usage.storage.limit)}`}
            </div>
            {!usage.storage.unlimited && (
              <>
                <Progress value={storagePercentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {storagePercentage.toFixed(1)}% of limit used
                </p>
              </>
            )}
            {usage.storage.unlimited && (
              <Badge variant="secondary" className="mt-2">Unlimited</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Access
          </CardTitle>
          <CardDescription>
            Features available in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant={features.analytics ? "default" : "secondary"}>
                {features.analytics ? "Available" : "Not Available"}
              </Badge>
              <span className="text-sm">Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={features.api ? "default" : "secondary"}>
                {features.api ? "Available" : "Not Available"}
              </Badge>
              <span className="text-sm">API Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={features.prioritySupport ? "default" : "secondary"}>
                {features.prioritySupport ? "Available" : "Not Available"}
              </Badge>
              <span className="text-sm">Priority Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={features.customWorkflows ? "default" : "secondary"}>
                {features.customWorkflows ? "Available" : "Not Available"}
              </Badge>
              <span className="text-sm">Custom Workflows</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      {(casesPercentage >= 75 || usersPercentage >= 75 || storagePercentage >= 75) && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Need more resources?</h3>
              <p className="text-muted-foreground mb-4">
                You're approaching your usage limits. Upgrade your plan to get more resources and features.
              </p>
              <Button>Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### Task 6: Set Up Promotional Pricing

#### 6.1 Create Promotional Codes

**File**: `scripts/create-promotional-codes.js`

```javascript
const { stripe } = require('../lib/stripe')

async function createPromotionalCodes() {
  console.log('Creating promotional codes...')

  const promotions = [
    {
      name: 'Early Bird Discount',
      code: 'EARLYBIRD2024',
      description: '20% off for early adopters',
      discount: {
        type: 'percentage',
        value: 20
      },
      maxRedemptions: 100,
      expiresAt: new Date('2024-12-31').getTime() / 1000
    },
    {
      name: 'Annual Discount',
      code: 'ANNUAL25',
      description: '25% off annual subscriptions',
      discount: {
        type: 'percentage',
        value: 25
      },
      maxRedemptions: 1000,
      expiresAt: new Date('2025-12-31').getTime() / 1000
    },
    {
      name: 'Student Discount',
      code: 'STUDENT50',
      description: '50% off for students',
      discount: {
        type: 'percentage',
        value: 50
      },
      maxRedemptions: 50,
      expiresAt: new Date('2025-06-30').getTime() / 1000
    }
  ]

  for (const promo of promotions) {
    try {
      // Create coupon
      const coupon = await stripe.coupons.create({
        name: promo.name,
        id: promo.code.toLowerCase(),
        percent_off: promo.discount.type === 'percentage' ? promo.discount.value : undefined,
        amount_off: promo.discount.type === 'fixed' ? promo.discount.value * 100 : undefined,
        currency: promo.discount.type === 'fixed' ? 'eur' : undefined,
        duration: 'forever',
        max_redemptions: promo.maxRedemptions,
        redeem_by: promo.expiresAt
      })

      // Create promotional code
      const promotionalCode = await stripe.promotionalCodes.create({
        coupon: coupon.id,
        code: promo.code,
        max_redemptions: promo.maxRedemptions,
        expires_at: promo.expiresAt,
        restrictions: {
          first_time_transaction: true
        }
      })

      console.log(`Created promotional code: ${promo.code}`)
      console.log(`Description: ${promo.description}`)
      console.log(`Coupon ID: ${coupon.id}`)
      console.log(`Promotional Code ID: ${promotionalCode.id}`)
      console.log('---')

    } catch (error) {
      console.error(`Failed to create promotional code ${promo.code}:`, error.message)
    }
  }
}

createPromotionalCodes().catch(console.error)
```

### Task 7: Configure Tax Settings

#### 7.1 Tax Configuration

**File**: `scripts/configure-tax-settings.js`

```javascript
const { stripe } = require('../lib/stripe')

async function configureTaxSettings() {
  console.log('Configuring tax settings...')

  try {
    // Create tax rates for different regions
    const taxRates = [
      {
        display_name: 'VAT (Germany)',
        percentage: 19,
        inclusive: false,
        country: 'DE',
        state: null,
        jurisdiction: {
          country: 'DE',
          state: null
        },
        description: 'German VAT rate'
      },
      {
        display_name: 'VAT (France)',
        percentage: 20,
        inclusive: false,
        country: 'FR',
        state: null,
        jurisdiction: {
          country: 'FR',
          state: null
        },
        description: 'French VAT rate'
      },
      {
        display_name: 'VAT (Spain)',
        percentage: 21,
        inclusive: false,
        country: 'ES',
        state: null,
        jurisdiction: {
          country: 'ES',
          state: null
        },
        description: 'Spanish VAT rate'
      },
      {
        display_name: 'VAT (Italy)',
        percentage: 22,
        inclusive: false,
        country: 'IT',
        state: null,
        jurisdiction: {
          country: 'IT',
          state: null
        },
        description: 'Italian VAT rate'
      }
    ]

    for (const taxRate of taxRates) {
      try {
        const created = await stripe.taxRates.create(taxRate)
        console.log(`Created tax rate: ${taxRate.display_name} (${taxRate.percentage}%)`)
        console.log(`Tax Rate ID: ${created.id}`)
        console.log('---')
      } catch (error) {
        console.error(`Failed to create tax rate ${taxRate.display_name}:`, error.message)
      }
    }

    // Configure automatic tax calculation
    console.log('Tax settings configured successfully!')
    console.log('Note: Enable automatic tax calculation in Stripe Dashboard:')
    console.log('1. Go to Settings > Tax')
    console.log('2. Enable "Automatic tax calculation"')
    console.log('3. Configure tax behavior for your products')

  } catch (error) {
    console.error('Error configuring tax settings:', error)
  }
}

configureTaxSettings().catch(console.error)
```

## Testing the Pricing Configuration

### 1. Test Pricing API

```bash
# Test pricing endpoint
curl -X GET http://localhost:3000/api/pricing

# Test pricing with annual options
curl -X GET http://localhost:3000/api/pricing?includeAnnual=true

# Test pricing comparison
curl -X GET http://localhost:3000/api/pricing/compare
```

### 2. Test Usage Limits

```bash
# Test usage limits
curl -X GET http://localhost:3000/api/usage/limits \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test feature access
curl -X GET http://localhost:3000/api/usage/features \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 3. Test Usage Enforcement

```bash
# Test creating a case (should be blocked if limit exceeded)
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"title": "Test Case", "description": "Test case description"}'
```

## Frontend Integration

### 1. Pricing Page

**File**: `app/pricing/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { PricingTable } from '@/components/pricing/pricing-table'
import { UsageDashboard } from '@/components/pricing/usage-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (tier: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier })
      })

      const data = await response.json()
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Select the perfect plan for your legal practice
        </p>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pricing">
          <PricingTable
            onSelectPlan={handleSelectPlan}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="usage">
          <UsageDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Notes
- Ensure that the pricing tiers are clearly defined and that customers understand what they are getting with each tier
- Regularly review and update pricing tiers based on customer feedback and business needs
- Implement proper usage monitoring and alerting for approaching limits
- Set up promotional pricing and discounts to attract new customers
- Configure tax settings according to your business location and customer base
- Test all pricing configurations thoroughly before going live

## Next Steps
After completing this step, the payment integration process is complete. You can proceed with other tasks in the go-live checklist.