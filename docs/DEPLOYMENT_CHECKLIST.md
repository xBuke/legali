# 🚀 iLegal Deployment Checklist

A comprehensive, step-by-step guide to deploy your iLegal case management application to Vercel.

## 📋 Table of Contents

1. [Pre-Deployment Checks](#1-pre-deployment-checks)
2. [Vercel Setup](#2-vercel-setup)
3. [Environment Variables](#3-environment-variables)
4. [Post-Deployment](#4-post-deployment)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Pre-Deployment Checks

### ✅ Build Verification

Before deploying, ensure your application builds successfully:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations (if needed)
npx prisma db push

# 4. Build the application
npm run build

# 5. Check for TypeScript errors
npm run lint
```

**Expected Results:**
- ✅ Build completes without errors
- ✅ No TypeScript compilation errors
- ✅ Prisma client generates successfully
- ✅ All pages compile correctly

### ✅ Local Testing

Test your application locally before deployment:

```bash
# 1. Start the development server
npm run dev

# 2. Open http://localhost:3000 in your browser
# 3. Test the following features:
```

**Test Checklist:**
- [ ] **Homepage loads** without errors
- [ ] **User registration** works (create a test account)
- [ ] **User login** works with the test account
- [ ] **User logout** works
- [ ] **Dashboard loads** with sample data
- [ ] **Navigation** works between pages
- [ ] **API endpoints** respond correctly (check browser network tab)

### ✅ Test User Creation

Create a test user for production verification:

```bash
# Run the test user creation script
node scripts/create-test-user.js
```

**Note:** Save the test user credentials - you'll need them to verify production deployment.

---

## 2. Vercel Setup

### 🔗 Connect GitHub Repository

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Import your repository:**
   - Select your GitHub account
   - Find and select your `ilegalclaude` repository
   - Click "Import"

### ⚙️ Configure Project Settings

1. **Project Name:** `ilegal` (or your preferred name)
2. **Framework Preset:** Next.js (should auto-detect)
3. **Root Directory:** `./` (default)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)
6. **Install Command:** `npm install` (default)

### 🗄️ Set Up Vercel Postgres Database

**CRITICAL:** Set up the database before your first deployment.

#### Option A: Via Vercel Dashboard (Recommended)

1. **In your Vercel project dashboard:**
   - Go to the "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Name: `ilegal-production-db`
   - Region: `iad1` (US East) or closest to your users
   - Click "Create"

2. **Get connection strings:**
   - After creation, you'll see `DATABASE_URL` and `DIRECT_URL`
   - Copy both values - you'll need them for environment variables

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create ilegal-production-db

# Pull environment variables
vercel env pull .env.local
```

### 📋 Import Environment Variables

After creating the database, you'll need to set up environment variables in Vercel:

1. **Go to your project dashboard**
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add the variables listed in the next section**

---

## 3. Environment Variables

### 🔐 Required Variables (Must Set)

Add these variables in Vercel Dashboard → Settings → Environment Variables:

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
```
**Source:** Copy from your Vercel Postgres database settings

#### Authentication
```bash
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**How to generate NEXTAUTH_SECRET:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**URL Format Examples:**
- If your domain is `ilegal-abc123.vercel.app`: `https://ilegal-abc123.vercel.app`
- If you have a custom domain: `https://yourdomain.com`

#### Production Settings
```bash
NODE_ENV=production
```

### 💳 Stripe Integration (Required for Billing)

If you want billing features, add these Stripe variables:

```bash
# Live keys (for production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to "Live mode" (toggle in top-left)
3. Go to "Developers" → "API keys"
4. Copy the "Secret key" and "Publishable key"
5. For webhook secret, create a webhook endpoint pointing to `https://your-domain.vercel.app/api/webhooks/stripe`

### 🔧 Optional Variables (Features Work Without These)

#### File Storage
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```
**Purpose:** Enables file uploads and document storage

#### Rate Limiting
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```
**Purpose:** Prevents API abuse and improves security

#### AI Features
```bash
OPENAI_API_KEY=sk-...
```
**Purpose:** Enables AI-powered document analysis and suggestions

#### Monitoring
```bash
SENTRY_DSN=https://...
```
**Purpose:** Error tracking and performance monitoring

### 📝 Environment Variable Checklist

- [ ] `DATABASE_URL` (from Vercel Postgres)
- [ ] `DIRECT_URL` (from Vercel Postgres)
- [ ] `NEXTAUTH_SECRET` (generated secure string)
- [ ] `NEXTAUTH_URL` (your Vercel domain)
- [ ] `NEXT_PUBLIC_APP_URL` (your Vercel domain)
- [ ] `NODE_ENV=production`
- [ ] Stripe variables (if using billing)
- [ ] Optional variables (if needed)

---

## 4. Post-Deployment

### 🚀 Deploy Your Application

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "feat: prepare for production deployment"
   git push origin main
   ```

2. **Vercel will automatically deploy** when you push to the main branch

3. **Monitor the deployment:**
   - Go to your Vercel dashboard
   - Click on the latest deployment
   - Watch the build logs for any errors

### ✅ Verify Deployment

#### 1. Check Build Success
- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] Prisma client generates successfully
- [ ] Database migrations run successfully

#### 2. Test Core Functionality
Visit your deployed URL and test:

- [ ] **Homepage loads** without errors
- [ ] **User registration** works
- [ ] **User login** works (use your test user)
- [ ] **Dashboard loads** with data
- [ ] **Navigation** works between pages
- [ ] **API endpoints** respond correctly

#### 3. Test Database Operations
- [ ] Create a new case
- [ ] Add a client
- [ ] Upload a document (if Blob storage configured)
- [ ] View analytics data

#### 4. Test Stripe Integration (if configured)
- [ ] Subscription signup works
- [ ] Payment processing works
- [ ] Webhook events are received

### 🔍 Check Vercel Function Logs

1. **Go to Vercel Dashboard**
2. **Click "Functions" tab**
3. **Check for any errors or warnings**
4. **Look for timeout issues** (should be under 30 seconds)

**Common log locations:**
- Build logs: Project → Deployments → [Latest] → Build Logs
- Function logs: Project → Functions → [Function Name] → Logs
- Runtime logs: Project → Functions → [Function Name] → Runtime Logs

### 👤 Create Production Test User

After deployment, create a test user to verify everything works:

```bash
# Option 1: Use the web interface
# Go to your deployed app → Sign Up → Create test account

# Option 2: Use the script (if you have access to the database)
# This requires database access, which may not be available in production
```

**Test User Credentials:**
- Email: `test@example.com`
- Password: `TestPassword123!`
- Name: `Test User`

---

## 5. Troubleshooting

### 🚨 Common Errors and Solutions

#### Database Connection Errors

**Error:** `PrismaClientInitializationError: Can't reach database server`

**Solutions:**
1. **Check environment variables:**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   # Verify DATABASE_URL and DIRECT_URL are set correctly
   ```

2. **Test database connection:**
   ```bash
   # Create a test file: test-db.js
   const { PrismaClient } = require('@prisma/client')
   const prisma = new PrismaClient()
   
   prisma.$connect()
     .then(() => console.log('Database connected!'))
     .catch(err => console.error('Connection failed:', err))
   ```

3. **Check database status:**
   - Go to Vercel Dashboard → Storage
   - Verify your Postgres database is running
   - Check if it's in the correct region

#### Authentication Errors

**Error:** `NEXTAUTH_URL` mismatch or authentication not working

**Solutions:**
1. **Verify NEXTAUTH_URL:**
   ```bash
   # Must match your exact domain
   NEXTAUTH_URL=https://your-exact-domain.vercel.app
   ```

2. **Check NEXTAUTH_SECRET:**
   ```bash
   # Must be at least 32 characters
   # Generate new one if needed
   openssl rand -base64 32
   ```

3. **Clear browser cookies** and try again

#### Build Failures

**Error:** Build fails during deployment

**Solutions:**
1. **Check build logs** in Vercel Dashboard
2. **Common causes:**
   - Missing environment variables
   - TypeScript compilation errors
   - Prisma client generation failures
   - Missing dependencies

3. **Fix TypeScript errors:**
   ```bash
   npm run lint
   # Fix any reported errors
   ```

4. **Test build locally:**
   ```bash
   npm run build
   # Should complete without errors
   ```

#### Function Timeouts

**Error:** API routes timeout after 30 seconds

**Solutions:**
1. **Check function logs** for slow queries
2. **Optimize database queries:**
   - Add `take: 1000` limits to large queries
   - Use proper indexing
   - Avoid N+1 queries

3. **Check Vercel configuration:**
   ```json
   // vercel.json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

#### Stripe Integration Issues

**Error:** Stripe payments not working

**Solutions:**
1. **Verify Stripe keys:**
   - Use live keys for production (not test keys)
   - Check key format: `sk_live_...` and `pk_live_...`

2. **Check webhook configuration:**
   - Webhook URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`

3. **Test webhook locally:**
   ```bash
   # Use Stripe CLI for testing
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 🔍 How to Check Logs

#### Vercel Dashboard Logs
1. **Go to your project dashboard**
2. **Click "Functions" tab**
3. **Select a function** to view its logs
4. **Check for errors, warnings, or performance issues**

#### Browser Developer Tools
1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Reload the page**
4. **Check for failed requests** (red entries)
5. **Click on failed requests** to see error details

#### Command Line Logs
```bash
# If you have Vercel CLI installed
vercel logs [deployment-url]

# Or check specific function logs
vercel logs [function-name]
```

### 🔄 How to Rollback

If deployment fails or causes issues:

#### Option 1: Rollback via Vercel Dashboard
1. **Go to Vercel Dashboard**
2. **Click "Deployments" tab**
3. **Find the last working deployment**
4. **Click "Promote to Production"**

#### Option 2: Rollback via Git
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to previous commit (if safe to do so)
git reset --hard HEAD~1
git push origin main --force
```

#### Option 3: Emergency Fix
1. **Identify the issue** from logs
2. **Make a quick fix** in your code
3. **Commit and push** the fix
4. **Monitor the new deployment**

### 📞 Getting Help

#### Vercel Support
- **Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Support:** [vercel.com/support](https://vercel.com/support)

#### Project-Specific Issues
- **Check existing documentation** in the `docs/` folder
- **Review error logs** for specific error messages
- **Test locally** to isolate issues
- **Check environment variables** are set correctly

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ **Build completes** without errors
- ✅ **Database connects** successfully
- ✅ **User registration/login** works
- ✅ **Dashboard loads** with data
- ✅ **API endpoints** respond correctly
- ✅ **No timeout errors** in logs
- ✅ **Performance is acceptable** (< 30s for analytics)
- ✅ **All core features** work as expected

---

## 📚 Additional Resources

- **Next.js Deployment:** [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Prisma with Vercel:** [prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- **Vercel Environment Variables:** [vercel.com/docs/projects/environment-variables](https://vercel.com/docs/projects/environment-variables)
- **Stripe Webhooks:** [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

**🎊 Congratulations! Once all tests pass, your iLegal application is live and ready for users!**
