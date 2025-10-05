# Step 4: Test Payment Flows and Integration

## Objective
Comprehensively test all payment flows and integration points to ensure that all payment-related functionalities work correctly, securely, and reliably with Stripe. This includes testing subscription creation, management, webhook processing, and edge cases.

## Prerequisites
- Stripe account configured (from Step 1)
- Subscription billing implemented (from Step 2)
- Webhook handling set up (from Step 3)
- Stripe CLI installed and configured
- Test environment with proper API keys

## Testing Overview

This step involves systematic testing of all payment-related functionality, including:
- Subscription creation and management
- Payment processing for each pricing tier
- Webhook handling and event processing
- Subscription upgrades and downgrades
- Subscription cancellation and refund processes
- Error handling and edge cases
- Security and fraud prevention

## Tasks

### Task 1: Set Up Test Environment

#### 1.1 Environment Configuration

**File**: `.env.test`

```env
# Test Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# Test Price IDs
STRIPE_BASIC_PRICE_ID=price_test_basic_price_id_here
STRIPE_PRO_PRICE_ID=price_test_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_test_enterprise_price_id_here

# Test Database
DATABASE_URL="file:./test.db"

# Test Mode
NODE_ENV=test
```

#### 1.2 Test Data Setup

**File**: `scripts/setup-test-data.js`

```javascript
const { PrismaClient } = require('@prisma/client')
const { stripe } = require('../lib/stripe')

const prisma = new PrismaClient()

async function setupTestData() {
  console.log('Setting up test data...')

  // Create test organization
  const testOrg = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      slug: 'test-org',
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      storageLimit: 1024 * 1024 * 1024, // 1GB
    }
  })

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      organizationId: testOrg.id,
      role: 'OWNER',
    }
  })

  // Create test Stripe customer
  const customer = await stripe.customers.create({
    email: 'test@example.com',
    name: 'Test User',
    metadata: {
      organizationId: testOrg.id,
      userId: testUser.id
    }
  })

  // Update organization with Stripe customer ID
  await prisma.organization.update({
    where: { id: testOrg.id },
    data: { stripeCustomerId: customer.id }
  })

  console.log('Test data setup complete!')
  console.log('Organization ID:', testOrg.id)
  console.log('User ID:', testUser.id)
  console.log('Stripe Customer ID:', customer.id)
}

setupTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Task 2: Test Subscription Creation

#### 2.1 Test Checkout Session Creation

**File**: `tests/billing/checkout.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/create-checkout/route')

describe('Checkout Session Creation', () => {
  test('should create checkout session for BASIC tier', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'BASIC' },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.checkoutUrl).toBeDefined()
    expect(data.sessionId).toBeDefined()
  })

  test('should reject invalid tier', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'INVALID' },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Invalid tier')
  })

  test('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'BASIC' }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Unauthorized')
  })
})
```

#### 2.2 Test Subscription Creation Flow

**File**: `tests/billing/subscription-creation.test.js`

```javascript
const { stripe } = require('../../lib/stripe')
const { db } = require('../../lib/db')

describe('Subscription Creation Flow', () => {
  test('should create subscription and update organization', async () => {
    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // Create test organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: customer.id,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    // Verify subscription was created
    expect(subscription.id).toBeDefined()
    expect(subscription.status).toBe('active')
    expect(subscription.customer).toBe(customer.id)

    // Clean up
    await stripe.subscriptions.del(subscription.id)
    await stripe.customers.del(customer.id)
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

### Task 3: Test Payment Processing

#### 3.1 Test Successful Payments

**File**: `tests/billing/payment-success.test.js`

```javascript
const { stripe } = require('../../lib/stripe')
const { db } = require('../../lib/db')

describe('Payment Success Flow', () => {
  test('should process successful payment', async () => {
    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // Create test organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: customer.id,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    // Simulate successful payment
    const invoice = await stripe.invoices.retrieve(
      subscription.latest_invoice
    )

    // Verify payment was successful
    expect(invoice.status).toBe('paid')
    expect(invoice.amount_paid).toBeGreaterThan(0)

    // Clean up
    await stripe.subscriptions.del(subscription.id)
    await stripe.customers.del(customer.id)
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

#### 3.2 Test Failed Payments

**File**: `tests/billing/payment-failure.test.js`

```javascript
const { stripe } = require('../../lib/stripe')

describe('Payment Failure Flow', () => {
  test('should handle payment failure', async () => {
    // Create test customer with card that will be declined
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // Create payment method that will fail
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4000000000000002', // Card that will be declined
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    })

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    })

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    })

    // Create subscription (this should fail)
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
        default_payment_method: paymentMethod.id,
      })

      // If we get here, the subscription was created but payment will fail
      expect(subscription.status).toBe('incomplete')
    } catch (error) {
      // Expected to fail
      expect(error.type).toBe('StripeCardError')
    }

    // Clean up
    await stripe.customers.del(customer.id)
  })
})
```

### Task 4: Test Webhook Processing

#### 4.1 Test Webhook Event Processing

**File**: `tests/webhooks/webhook-processing.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/webhooks/stripe/route')
const { stripe } = require('../../lib/stripe')

describe('Webhook Processing', () => {
  test('should process customer.subscription.created event', async () => {
    // Create test event
    const event = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_subscription',
          customer: 'cus_test_customer',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          items: {
            data: [{
              price: {
                id: process.env.STRIPE_BASIC_PRICE_ID
              }
            }]
          },
          metadata: {
            organizationId: 'test_org_id',
            subscriptionTier: 'BASIC'
          }
        }
      },
      created: Math.floor(Date.now() / 1000)
    }

    // Create mock request
    const { req, res } = createMocks({
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'stripe-signature': 'valid_signature'
      }
    })

    // Mock stripe.webhooks.constructEvent
    stripe.webhooks.constructEvent = jest.fn().mockReturnValue(event)

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.received).toBe(true)
  })

  test('should reject invalid webhook signature', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: '{"test": "data"}',
      headers: {
        'stripe-signature': 'invalid_signature'
      }
    })

    // Mock stripe.webhooks.constructEvent to throw error
    stripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Webhook error')
  })
})
```

#### 4.2 Test Webhook Event Handling

**File**: `tests/webhooks/event-handlers.test.js`

```javascript
const { db } = require('../../lib/db')
const { handleSubscriptionCreated } = require('../../app/api/webhooks/stripe/route')

describe('Webhook Event Handlers', () => {
  test('should handle subscription created event', async () => {
    // Create test organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: 'cus_test_customer',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Create test subscription object
    const subscription = {
      id: 'sub_test_subscription',
      customer: 'cus_test_customer',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [{
          price: {
            id: process.env.STRIPE_BASIC_PRICE_ID
          }
        }]
      },
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    }

    // Process the event
    await handleSubscriptionCreated(subscription)

    // Verify organization was updated
    const updatedOrg = await db.organization.findUnique({
      where: { id: org.id }
    })

    expect(updatedOrg.subscriptionTier).toBe('BASIC')
    expect(updatedOrg.subscriptionStatus).toBe('ACTIVE')
    expect(updatedOrg.stripeSubscriptionId).toBe('sub_test_subscription')

    // Clean up
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

### Task 5: Test Subscription Management

#### 5.1 Test Subscription Upgrades

**File**: `tests/billing/subscription-upgrade.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/upgrade/route')
const { stripe } = require('../../lib/stripe')
const { db } = require('../../lib/db')

describe('Subscription Upgrade', () => {
  test('should upgrade subscription from BASIC to PRO', async () => {
    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // Create test organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: customer.id,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    // Update organization with subscription ID
    await db.organization.update({
      where: { id: org.id },
      data: { stripeSubscriptionId: subscription.id }
    })

    // Test upgrade
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'PRO' },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.subscription.tier).toBe('PRO')

    // Clean up
    await stripe.subscriptions.del(subscription.id)
    await stripe.customers.del(customer.id)
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

#### 5.2 Test Subscription Cancellation

**File**: `tests/billing/subscription-cancellation.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/cancel/route')
const { stripe } = require('../../lib/stripe')
const { db } = require('../../lib/db')

describe('Subscription Cancellation', () => {
  test('should cancel subscription at period end', async () => {
    // Create test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // Create test organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: customer.id,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    // Update organization with subscription ID
    await db.organization.update({
      where: { id: org.id },
      data: { stripeSubscriptionId: subscription.id }
    })

    // Test cancellation
    const { req, res } = createMocks({
      method: 'POST',
      body: { cancelAtPeriodEnd: true },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.cancelAtPeriodEnd).toBe(true)

    // Clean up
    await stripe.subscriptions.del(subscription.id)
    await stripe.customers.del(customer.id)
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

### Task 6: Test Error Handling

#### 6.1 Test API Error Handling

**File**: `tests/billing/error-handling.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/create-checkout/route')

describe('Error Handling', () => {
  test('should handle missing tier parameter', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Invalid tier')
  })

  test('should handle invalid JSON', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: 'invalid json',
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(500)
  })

  test('should handle Stripe API errors', async () => {
    // Mock Stripe to throw error
    const { stripe } = require('../../lib/stripe')
    stripe.checkout.sessions.create = jest.fn().mockRejectedValue(
      new Error('Stripe API Error')
    )

    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'BASIC' },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Failed to create checkout session')
  })
})
```

### Task 7: Test Security

#### 7.1 Test Authentication

**File**: `tests/security/authentication.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/create-checkout/route')

describe('Authentication', () => {
  test('should require valid session', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'BASIC' }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Unauthorized')
  })

  test('should reject invalid session token', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: 'BASIC' },
      headers: {
        authorization: 'Bearer invalid_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Unauthorized')
  })
})
```

#### 7.2 Test Input Validation

**File**: `tests/security/input-validation.test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/create-checkout/route')

describe('Input Validation', () => {
  test('should validate tier parameter', async () => {
    const invalidTiers = ['INVALID', '', null, undefined, 123, {}]

    for (const tier of invalidTiers) {
      const { req, res } = createMocks({
        method: 'POST',
        body: { tier },
        headers: {
          authorization: 'Bearer valid_session_token'
        }
      })

      await handler.POST(req)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Invalid tier')
    }
  })

  test('should handle SQL injection attempts', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { tier: "'; DROP TABLE organizations; --" },
      headers: {
        authorization: 'Bearer valid_session_token'
      }
    })

    await handler.POST(req)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Invalid tier')
  })
})
```

### Task 8: Performance Testing

#### 8.1 Load Testing

**File**: `tests/performance/load-test.js`

```javascript
const { createMocks } = require('node-mocks-http')
const handler = require('../../app/api/billing/create-checkout/route')

describe('Performance Testing', () => {
  test('should handle concurrent requests', async () => {
    const requests = []
    const numRequests = 10

    for (let i = 0; i < numRequests; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        body: { tier: 'BASIC' },
        headers: {
          authorization: 'Bearer valid_session_token'
        }
      })

      requests.push(handler.POST(req))
    }

    const startTime = Date.now()
    const results = await Promise.all(requests)
    const endTime = Date.now()

    // All requests should complete successfully
    results.forEach(result => {
      expect(result.status).toBe(200)
    })

    // Should complete within reasonable time
    const duration = endTime - startTime
    expect(duration).toBeLessThan(5000) // 5 seconds
  })
})
```

### Task 9: Integration Testing

#### 9.1 End-to-End Testing

**File**: `tests/integration/e2e.test.js`

```javascript
const { stripe } = require('../../lib/stripe')
const { db } = require('../../lib/db')

describe('End-to-End Payment Flow', () => {
  test('should complete full payment flow', async () => {
    // 1. Create customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User'
    })

    // 2. Create organization
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        stripeCustomerId: customer.id,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE'
      }
    })

    // 3. Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_BASIC_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    expect(session.id).toBeDefined()
    expect(session.url).toBeDefined()

    // 4. Simulate successful checkout
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_BASIC_PRICE_ID }],
      metadata: {
        organizationId: org.id,
        subscriptionTier: 'BASIC'
      }
    })

    // 5. Verify subscription was created
    expect(subscription.id).toBeDefined()
    expect(subscription.status).toBe('active')

    // 6. Update organization
    await db.organization.update({
      where: { id: org.id },
      data: {
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        stripeSubscriptionId: subscription.id
      }
    })

    // 7. Verify organization was updated
    const updatedOrg = await db.organization.findUnique({
      where: { id: org.id }
    })

    expect(updatedOrg.subscriptionTier).toBe('BASIC')
    expect(updatedOrg.subscriptionStatus).toBe('ACTIVE')
    expect(updatedOrg.stripeSubscriptionId).toBe(subscription.id)

    // Clean up
    await stripe.subscriptions.del(subscription.id)
    await stripe.customers.del(customer.id)
    await db.organization.delete({ where: { id: org.id } })
  })
})
```

### Task 10: Test Automation

#### 10.1 Test Runner Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    'components/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

#### 10.2 Test Setup

**File**: `tests/setup.js`

```javascript
// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret'
process.env.DATABASE_URL = 'file:./test.db'

// Mock Stripe
jest.mock('../lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      del: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      del: jest.fn()
    },
    checkout: {
      sessions: {
        create: jest.fn()
      }
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }
}))

// Mock database
jest.mock('../lib/db', () => ({
  db: {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))
```

## Testing Checklist

### Functional Testing
- [ ] Subscription creation for all tiers (BASIC, PRO, ENTERPRISE)
- [ ] Payment processing with valid cards
- [ ] Payment processing with invalid cards
- [ ] Subscription upgrades and downgrades
- [ ] Subscription cancellation
- [ ] Subscription renewal
- [ ] Invoice generation and retrieval
- [ ] Customer portal access
- [ ] Webhook event processing
- [ ] Error handling for all scenarios

### Security Testing
- [ ] Authentication and authorization
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Webhook signature verification
- [ ] API key security

### Performance Testing
- [ ] Response time under normal load
- [ ] Response time under high load
- [ ] Concurrent request handling
- [ ] Database query performance
- [ ] Memory usage
- [ ] CPU usage

### Integration Testing
- [ ] End-to-end payment flow
- [ ] Webhook integration
- [ ] Database integration
- [ ] Stripe API integration
- [ ] Error recovery
- [ ] Data consistency

## Test Execution

### 1. Run All Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=billing

# Run tests in watch mode
npm run test:watch
```

### 2. Run Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### 3. Run Performance Tests

```bash
# Run performance tests
npm run test:performance

# Run load tests
npm run test:load
```

## Test Data Management

### 1. Test Data Cleanup

**File**: `tests/cleanup.js`

```javascript
const { PrismaClient } = require('@prisma/client')
const { stripe } = require('../lib/stripe')

const prisma = new PrismaClient()

async function cleanupTestData() {
  console.log('Cleaning up test data...')

  // Clean up test organizations
  await prisma.organization.deleteMany({
    where: {
      name: {
        startsWith: 'Test'
      }
    }
  })

  // Clean up test users
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  })

  // Clean up Stripe test data
  const customers = await stripe.customers.list({ limit: 100 })
  for (const customer of customers.data) {
    if (customer.email?.includes('test')) {
      await stripe.customers.del(customer.id)
    }
  }

  console.log('Test data cleanup complete!')
}

cleanupTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Monitoring and Alerting

### 1. Test Results Monitoring

**File**: `tests/monitoring.js`

```javascript
const fs = require('fs')
const path = require('path')

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    successRate: (results.numPassedTests / results.numTotalTests) * 100,
    duration: results.startTime - results.endTime,
    failures: results.testResults
      .filter(result => result.status === 'failed')
      .map(result => ({
        test: result.testFilePath,
        error: result.failureMessages
      }))
  }

  // Save report
  const reportPath = path.join(__dirname, 'reports', `test-report-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Send alert if success rate is below threshold
  if (report.successRate < 95) {
    console.error(`Test success rate is below threshold: ${report.successRate}%`)
    // Send alert to monitoring system
  }

  return report
}
```

## Notes
- Use test environments and test data to avoid affecting live payment processes
- Document any issues or bugs found during testing and ensure they are resolved before proceeding to the next step
- Implement comprehensive test coverage for all payment-related functionality
- Set up automated testing in CI/CD pipeline
- Monitor test results and set up alerts for failures
- Regularly update tests as new features are added

## Next Steps
After completing this step, proceed to Step 5: Configure Pricing Tiers.