# Step 1: Set up Stripe Account

## Objective
Set up a Stripe account to handle payment processing for the iLegal application. This step is crucial for enabling subscription billing, payment tracking, and secure payment processing.

## Prerequisites
- Business email address
- Business information (name, address, tax ID if applicable)
- Bank account details for payouts
- Valid government-issued ID for verification
- Business registration documents (if applicable)

## Step-by-Step Tutorial

### Step 1: Create a Stripe Account

1. **Visit Stripe Website**
   - Go to [https://stripe.com](https://stripe.com)
   - Click the "Start now" or "Sign up" button

2. **Sign Up Process**
   - Enter your business email address
   - Create a strong password
   - Click "Create account"
   - Check your email for verification link and click it

3. **Complete Initial Setup**
   - Fill in your business information:
     - Business name: "iLegal" (or your business name)
     - Business type: Select appropriate option (e.g., "Software/SaaS")
     - Country/Region: Select your location
     - Business website: Your domain (e.g., `ilegal.yourdomain.com`)
   - Accept terms of service and privacy policy

### Step 2: Verify Your Account

1. **Identity Verification**
   - Go to [Account Settings > Identity verification](https://dashboard.stripe.com/account/identity)
   - Upload required documents:
     - Government-issued ID (passport, driver's license)
     - Proof of address (utility bill, bank statement)
   - Submit for review (typically takes 1-3 business days)

2. **Business Verification** (if applicable)
   - Upload business registration documents
   - Provide tax identification number
   - Submit business bank account details
   - Complete business profile with detailed information

### Step 3: Set Up Your Business Profile

1. **Business Information**
   - Go to [Settings > Business settings](https://dashboard.stripe.com/settings/business)
   - Configure:
     - Business name and description
     - Business address
     - Contact information
     - Tax information
     - Business category

2. **Payment Methods**
   - Go to [Settings > Payment methods](https://dashboard.stripe.com/settings/payment_methods)
   - Enable payment methods you want to accept:
     - ✅ Credit and debit cards
     - ✅ SEPA Direct Debit (for EU customers)
     - ✅ Bank transfers
     - ✅ Digital wallets (Apple Pay, Google Pay)

### Step 4: Configure Tax Settings

1. **Tax Configuration**
   - Go to [Settings > Tax](https://dashboard.stripe.com/settings/tax)
   - Configure tax rates based on your location:
     - EU VAT rates (if applicable)
     - US state taxes (if applicable)
     - Other regional taxes
   - Set up tax calculation rules

2. **Tax Registration**
   - Add your tax registration numbers
   - Configure tax reporting settings
   - Set up automatic tax calculation

### Step 5: Set Up Payouts

1. **Bank Account Setup**
   - Go to [Settings > Payouts](https://dashboard.stripe.com/settings/payouts)
   - Add your bank account details
   - Verify your bank account (may require micro-deposits)

2. **Payout Schedule**
   - Set payout schedule (daily, weekly, or monthly)
   - Configure payout currency
   - Set up reserve amounts if needed

### Step 6: Create Products and Pricing

1. **Create Products**
   - Go to [Products](https://dashboard.stripe.com/products)
   - Click "Add product"

2. **BASIC Plan (€147/month)**
   - Product name: "iLegal BASIC"
   - Description: "Essential legal case management features"
   - Pricing:
     - Price: €147.00
     - Billing period: Monthly
     - Currency: EUR
   - Features to include:
     - Up to 50 cases
     - Basic document management
     - Time tracking
     - Client portal access
     - Email support
   - Copy the Price ID (starts with `price_`) for later use

3. **PRO Plan (€297/month)**
   - Product name: "iLegal PRO"
   - Description: "Advanced legal practice management"
   - Pricing:
     - Price: €297.00
     - Billing period: Monthly
     - Currency: EUR
   - Features to include:
     - Unlimited cases
     - Advanced analytics
     - Custom workflows
     - API access
     - Priority support
     - Advanced reporting
   - Copy the Price ID for later use

4. **ENTERPRISE Plan (€497/month)**
   - Product name: "iLegal ENTERPRISE"
   - Description: "Complete legal practice solution"
   - Pricing:
     - Price: €497.00
     - Billing period: Monthly
     - Currency: EUR
   - Features to include:
     - Everything in PRO
     - White-label options
     - Custom integrations
     - Dedicated account manager
     - SLA guarantees
     - Custom training
   - Copy the Price ID for later use

### Step 7: Obtain API Keys

1. **Access API Settings**
   - Go to [Developers > API keys](https://dashboard.stripe.com/apikeys)
   - Toggle to **Test mode** (top right corner) for development

2. **Get Test API Keys**
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)
   - **IMPORTANT**: Keep these keys secure and never share them publicly

3. **Store API Keys Securely**
   - Add to your `.env` file:
     ```env
     # Stripe Test Keys (Development)
     STRIPE_SECRET_KEY=sk_test_your_secret_key_here
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
     
     # Stripe Price IDs (Test Mode)
     STRIPE_BASIC_PRICE_ID=price_your_basic_price_id_here
     STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
     STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here
     ```

### Step 8: Set Up Webhook Endpoints

1. **Create Webhook**
   - Go to [Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"

2. **Configure Webhook**
   - Endpoint URL: 
     - **Local development**: `http://localhost:3000/api/webhooks/stripe`
     - **Production**: `https://yourdomain.com/api/webhooks/stripe`
   - Events to subscribe to:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `invoice.payment_action_required`
     - ✅ `checkout.session.completed`
     - ✅ `customer.created`
     - ✅ `customer.updated`

3. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Copy the **Signing secret** (starts with `whsec_`)
   - Add to your `.env` file:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
     ```

### Step 9: Test Payment Flow

1. **Create Test Customer**
   - Go to [Customers](https://dashboard.stripe.com/customers)
   - Click "Add customer"
   - Use test email: `test@example.com`

2. **Test Checkout Session**
   - Use Stripe's test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`
     - Requires authentication: `4000 0025 0000 3155`
   - Test with different scenarios:
     - Successful payment
     - Failed payment
     - 3D Secure authentication

3. **Test Webhook Events**
   - Use Stripe CLI to forward webhooks:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - Trigger test events:
     ```bash
     stripe trigger customer.subscription.created
     stripe trigger invoice.payment_succeeded
     ```

### Step 10: Configure Customer Portal

1. **Set Up Customer Portal**
   - Go to [Settings > Billing > Customer portal](https://dashboard.stripe.com/settings/billing/portal)
   - Configure portal settings:
     - Business information
     - Payment methods
     - Subscription management
     - Invoice history
     - Update payment methods

2. **Customize Portal**
   - Add your business logo
   - Customize colors and branding
   - Configure allowed actions for customers

## Important Links

- **Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **API Documentation**: [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Webhook Documentation**: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Pricing Calculator**: [https://stripe.com/pricing](https://stripe.com/pricing)
- **Support Center**: [https://support.stripe.com](https://support.stripe.com)
- **Stripe CLI**: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables for all keys
   - Rotate keys regularly
   - Use different keys for development and production
   - Use restricted API keys when possible

2. **Webhook Security**
   - Verify webhook signatures
   - Use HTTPS endpoints only
   - Implement idempotency for webhook processing
   - Log all webhook events for debugging
   - Use webhook endpoint secrets

3. **Data Protection**
   - Encrypt sensitive customer data
   - Implement proper access controls
   - Regular security audits
   - GDPR compliance measures
   - PCI DSS compliance (handled by Stripe)

## Testing with Stripe CLI

### Installation
```bash
# Install Stripe CLI
# Windows (using Chocolatey)
choco install stripe-cli

# macOS (using Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Usage
```bash
# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger checkout.session.completed
```

## Troubleshooting

### Common Issues

1. **Account Verification Delays**
   - Contact support if verification takes longer than 3 days
   - Ensure all documents are clear and readable
   - Double-check business information accuracy
   - Complete all required fields

2. **Webhook Failures**
   - Check webhook URL accessibility
   - Verify SSL certificate validity
   - Review webhook event logs in Stripe Dashboard
   - Test with Stripe CLI
   - Check webhook signature verification

3. **API Rate Limits**
   - Monitor API usage in dashboard
   - Implement proper rate limiting in your application
   - Use webhooks instead of polling when possible
   - Consider using Stripe's retry logic

4. **Payment Failures**
   - Check card details and expiration
   - Verify 3D Secure authentication
   - Review fraud detection settings
   - Check customer's bank restrictions

### Testing Checklist

- [ ] Account verification completed
- [ ] API keys obtained and stored securely
- [ ] Products and prices created
- [ ] Webhook endpoint configured
- [ ] Test payments successful
- [ ] Webhook events received
- [ ] Customer portal accessible
- [ ] Subscription management working
- [ ] Invoice generation working
- [ ] Payment failure handling working

## Production Deployment

### Switch to Live Mode
1. In Stripe Dashboard, toggle to **Live mode**
2. Get live API keys and update `.env`
3. Create live products and prices
4. Update webhook endpoint to production URL
5. Test with real payment methods
6. Update environment variables:

```env
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Live Price IDs
STRIPE_BASIC_PRICE_ID=price_your_live_basic_price_id_here
STRIPE_PRO_PRICE_ID=price_your_live_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_live_enterprise_price_id_here
```

## Notes
- Stripe provides comprehensive payment processing with built-in fraud protection
- All payment data is PCI DSS compliant through Stripe
- Stripe handles tax calculation and reporting in many jurisdictions
- Webhook events ensure real-time synchronization with your application
- Customer portal provides self-service subscription management
- Stripe supports multiple payment methods and currencies

## Next Steps
After completing this step, proceed to Step 2: Implement Subscription Billing.
