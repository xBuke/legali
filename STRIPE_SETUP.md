# Stripe Setup Guide for iLegal

This guide covers all the Stripe API keys and configuration needed to fix subscription finalizations.

## Required Environment Variables

Add these to your `.env` file:

```env
# Core Stripe Keys (Required)
STRIPE_SECRET_KEY=sk_test_...                    # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook endpoint secret

# Subscription Price IDs (Required)
STRIPE_BASIC_PRICE_ID=price_...                  # €147/month Basic plan
STRIPE_PRO_PRICE_ID=price_...                    # €297/month Pro plan  
STRIPE_ENTERPRISE_PRICE_ID=price_...             # €497/month Enterprise plan
```

## How to Get These Keys

### 1. Stripe Account Setup
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create account or sign in
3. Toggle to **Test mode** (top right corner)

### 2. Get API Keys
1. Go to "Developers" → "API keys"
2. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 3. Create Products and Prices
1. Go to "Products" in Stripe Dashboard
2. Create these products:

**Product 1: iLegal Basic**
- Name: `iLegal Basic`
- Description: `Basic plan with up to 3 users`
- Price: `€147.00`
- Billing period: `Monthly`
- Copy the Price ID (starts with `price_`) → Add to `.env` as `STRIPE_BASIC_PRICE_ID`

**Product 2: iLegal Pro**
- Name: `iLegal Pro`
- Description: `Pro plan with up to 6 users and AI features`
- Price: `€297.00`
- Billing period: `Monthly`
- Copy the Price ID → Add to `.env` as `STRIPE_PRO_PRICE_ID`

**Product 3: iLegal Enterprise**
- Name: `iLegal Enterprise`
- Description: `Enterprise plan with unlimited users and advanced features`
- Price: `€497.00`
- Billing period: `Monthly`
- Copy the Price ID → Add to `.env` as `STRIPE_ENTERPRISE_PRICE_ID`

### 4. Set Up Webhook
1. Go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Set endpoint URL:
   - **Local development**: `http://localhost:3000/api/webhooks/stripe`
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook secret (starts with `whsec_`) → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## New API Endpoints Created

The following endpoints have been created to handle subscription finalization:

### 1. Create Checkout Session
**POST** `/api/billing/create-checkout`
- Creates a Stripe checkout session for new subscriptions
- Body: `{ "tier": "BASIC" | "PRO" | "ENTERPRISE" }`
- Returns: `{ "checkoutUrl": "...", "sessionId": "..." }`

### 2. Customer Portal
**POST** `/api/billing/portal`
- Creates a Stripe customer portal session for subscription management
- Returns: `{ "portalUrl": "..." }`

### 3. Upgrade Subscription
**POST** `/api/billing/upgrade`
- Upgrades or downgrades existing subscription
- Body: `{ "tier": "BASIC" | "PRO" | "ENTERPRISE" }`
- Returns: Updated subscription details

### 4. Enhanced Webhook Handler
**POST** `/api/webhooks/stripe`
- Handles all Stripe webhook events
- Updates organization subscription status automatically
- Processes payment success/failure events

## Testing the Integration

### 1. Test Checkout Flow
```bash
# Create a checkout session
curl -X POST http://localhost:3000/api/billing/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"tier": "PRO"}'
```

### 2. Test Webhook
Use Stripe CLI to forward webhooks to your local development:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Test Customer Portal
```bash
# Create portal session
curl -X POST http://localhost:3000/api/billing/portal \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Production Deployment

### 1. Switch to Live Mode
1. In Stripe Dashboard, toggle to **Live mode**
2. Get live API keys and update `.env`
3. Create live products and prices
4. Update webhook endpoint to production URL

### 2. Environment Variables for Production
```env
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_...                    # Live secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   # Live publishable key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Live webhook secret

# Live Price IDs
STRIPE_BASIC_PRICE_ID=price_...                  # Live Basic price ID
STRIPE_PRO_PRICE_ID=price_...                    # Live Pro price ID
STRIPE_ENTERPRISE_PRICE_ID=price_...             # Live Enterprise price ID
```

## Troubleshooting

### Common Issues

1. **"Stripe not configured" error**
   - Check that `STRIPE_SECRET_KEY` is set in `.env`
   - Restart your development server after adding keys

2. **Webhook signature verification failed**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Check webhook endpoint URL in Stripe Dashboard

3. **Price ID not found**
   - Verify all price IDs are correctly set in `.env`
   - Check that products are created in the correct Stripe mode (test/live)

4. **Subscription not updating**
   - Check webhook events are properly configured
   - Verify webhook endpoint is accessible
   - Check server logs for webhook processing errors

### Testing with Stripe CLI
```bash
# Install Stripe CLI
# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Security Notes

- Never commit `.env` files to version control
- Use test keys for development
- Switch to live keys only for production
- Regularly rotate API keys
- Monitor webhook events for suspicious activity
