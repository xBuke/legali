# 🚀 Switching to Stripe Production Mode

## ⚠️ **CRITICAL: Complete These Steps First**

### Step 1: Verify Your Stripe Account for Live Mode

1. **Go to Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Switch to Live Mode**: Toggle the "Test mode" switch in the top right
3. **Complete Account Verification**:
   - Upload required business documents
   - Verify your identity
   - Add bank account details
   - Complete tax information
   - Wait for approval (can take 1-3 business days)

### Step 2: Get Your Live API Keys

1. **In Live Mode**, go to [Developers > API keys](https://dashboard.stripe.com/apikeys)
2. **Copy your Live API Keys**:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

### Step 3: Create Live Products and Prices

1. **Go to Products** in live mode
2. **Create your subscription plans**:
   - iLegal BASIC (€147/month)
   - iLegal PRO (€297/month)  
   - iLegal ENTERPRISE (€497/month)
3. **Copy the Live Price IDs** (start with `price_`)

### Step 4: Set Up Live Webhooks

1. **Go to Webhooks** in live mode
2. **Create new webhook endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Same as test mode
3. **Copy the Live Webhook Secret** (starts with `whsec_`)

## 🔧 **Configure Stripe CLI for Live Mode**

### Option 1: Using Live API Keys Directly

```bash
# Set live API key
stripe config --set test_mode_api_key="sk_live_your_live_secret_key_here"

# Test live mode
stripe customers list --limit=1
```

### Option 2: Using Environment Variables

```bash
# Set environment variables
export STRIPE_SECRET_KEY="sk_live_your_live_secret_key_here"
export STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key_here"

# Test live mode
stripe customers list --limit=1
```

## 🧪 **Test Production Mode**

### 1. Test Live API Access
```bash
# List live customers
stripe customers list --limit=1

# Create a test customer (be careful - this is live!)
stripe customers create --email="test@yourdomain.com" --name="Test Customer"
```

### 2. Test Live Webhooks
```bash
# Forward live webhooks to your production server
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe --live
```

### 3. Test Live Payment Flow
```bash
# Create a live checkout session (be careful - this is live!)
stripe checkout sessions create \
  --customer="cus_live_customer_id" \
  --line-items[0][price]="price_live_basic_price_id" \
  --line-items[0][quantity]=1 \
  --mode=subscription \
  --success-url="https://yourdomain.com/dashboard?success=true" \
  --cancel-url="https://yourdomain.com/dashboard?canceled=true" \
  --live
```

## 🔒 **Update Your Application Environment**

### Production Environment Variables
```env
# Live Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Live Price IDs
STRIPE_BASIC_PRICE_ID=price_your_live_basic_price_id_here
STRIPE_PRO_PRICE_ID=price_your_live_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_live_enterprise_price_id_here

# Production URLs
NEXTAUTH_URL=https://yourdomain.com
```

## ⚠️ **CRITICAL WARNINGS**

### 🚨 **LIVE MODE = REAL MONEY**
- **Never test with real payment methods in live mode**
- **All transactions in live mode are real and will be charged**
- **Use test mode for all development and testing**

### 🚨 **Security Requirements**
- **Never commit live API keys to version control**
- **Use environment variables for all sensitive data**
- **Enable webhook signature verification**
- **Use HTTPS for all webhook endpoints**

### 🚨 **Testing in Live Mode**
- **Only test with your own payment methods**
- **Start with small amounts**
- **Monitor all transactions carefully**
- **Have a rollback plan ready**

## 📋 **Pre-Production Checklist**

- [ ] Stripe account fully verified for live mode
- [ ] Live API keys obtained and secured
- [ ] Live products and prices created
- [ ] Live webhook endpoint configured
- [ ] Application environment variables updated
- [ ] SSL certificate installed on production domain
- [ ] Webhook signature verification enabled
- [ ] Payment flow tested with small amounts
- [ ] Error handling and logging configured
- [ ] Monitoring and alerting set up

## 🎯 **Current Status**

**You are currently in TEST MODE only.**
- ✅ Test API keys configured
- ✅ Test webhooks working
- ✅ Test payment flows verified
- ❌ Live mode not yet configured
- ❌ Production deployment not ready

## 🚀 **Next Steps**

1. **Complete Stripe account verification** (if not done)
2. **Get live API keys** from Stripe Dashboard
3. **Create live products and prices**
4. **Set up live webhook endpoint**
5. **Update application with live keys**
6. **Deploy to production**
7. **Test with small real transactions**

## 📞 **Support**

If you need help with any of these steps:
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)

---

**Remember: Live mode means real money. Be extremely careful and test thoroughly before going live!**
