# iLegal Implementation Guide

This guide will help you get iLegal up and running from scratch.

## 🎯 Quick Start (15 minutes)

### Step 1: Prerequisites Setup

1. **Install Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org)
   - Verify: `node --version`

2. **Install Git**
   - Download from [git-scm.com](https://git-scm.com)
   - Verify: `git --version`

3. **Create accounts** (you can use free tiers initially):
   - [NextAuth.js](https://next-auth.js.org) - Authentication
   - [Stripe](https://stripe.com) - Payments (test mode)
   - [OpenAI](https://platform.openai.com) - AI features
   - [Vercel](https://vercel.com) - Hosting

### Step 2: Project Setup

```bash
# 1. Navigate to project directory
cd ilegalclaude

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate
```

### Step 3: Environment Configuration

1. **Copy example env file:**
```bash
cp .env.example .env
```

2. **Generate encryption key:**
```bash
# On Windows (PowerShell):
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)

# On Mac/Linux:
openssl rand -base64 32
```

3. **Fill in `.env` with your keys:**

```env
# Database - Start with Vercel Postgres or local PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/ilegal"

# NextAuth.js - Already configured
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe - Get from dashboard.stripe.com (use test keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OpenAI - Get from platform.openai.com
OPENAI_API_KEY=sk-...

# Vercel Blob - Get after connecting to Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Your generated encryption key
ENCRYPTION_KEY=your-generated-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Database Setup

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL locally
# Then create database:
createdb ilegal

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ilegal"

# Push schema
npm run db:push
```

**Option B: Vercel Postgres (Recommended for deployment)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Create Postgres database
vercel postgres create

# Pull environment variables
vercel env pull .env.local
```

### Step 5: NextAuth.js Configuration

1. NextAuth.js is already configured
2. Create new application
3. Enable Email/Password authentication
4. Enable 2FA (Two-Factor Authentication)
5. Configure redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/onboarding`
6. Copy API keys to `.env`

### Step 6: Stripe Configuration

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle to **Test mode** (top right)
3. Get API keys from "Developers" → "API keys"
4. Create products:

```bash
# You'll create these in Stripe Dashboard → Products:

Product 1: iLegal Basic
- Price: €147/month
- Copy price ID → Add to .env as STRIPE_BASIC_PRICE_ID

Product 2: iLegal Pro
- Price: €297/month
- Copy price ID → Add to .env as STRIPE_PRO_PRICE_ID

Product 3: iLegal Enterprise
- Price: €497/month
- Copy price ID → Add to .env as STRIPE_ENTERPRISE_PRICE_ID
```

5. Set up webhook:
   - Go to "Developers" → "Webhooks"
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe` (for local dev)
   - Select events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`
   - Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📝 Development Workflow

### Creating Database Changes

```bash
# 1. Modify prisma/schema.prisma
# 2. Push changes to database
npm run db:push

# 3. View/edit data
npm run db:studio
```

### Adding New Features

1. Create database schema changes in `prisma/schema.prisma`
2. Create API routes in `app/api/`
3. Create UI components in `components/`
4. Create pages in `app/(dashboard)/`

### File Structure Best Practices

```
app/
├── (auth)/              # Auth pages (sign-in, sign-up)
├── (dashboard)/         # Main app (protected routes)
│   ├── cases/          # Cases feature
│   ├── clients/        # Clients feature
│   ├── documents/      # Documents feature
│   ├── billing/        # Billing feature
│   └── settings/       # Settings
├── api/                # API routes
│   ├── cases/         # Case endpoints
│   ├── webhooks/      # Webhook handlers
│   └── ...
└── layout.tsx         # Root layout

components/
├── ui/                # shadcn/ui components
├── cases/            # Case-related components
├── clients/          # Client-related components
└── ...

lib/
├── db.ts             # Database client
├── utils.ts          # Utility functions
└── ...
```

---

## 🚀 Deployment to Vercel

### First-Time Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set up production database
vercel postgres create --prod

# 5. Add environment variables in Vercel Dashboard
# Go to: Settings → Environment Variables
# Add all variables from .env

# 6. Update NextAuth.js URLs with production domain
# Update Stripe webhook URL with production domain

# 7. Deploy to production
vercel --prod
```

### Subsequent Deployments

```bash
# Just push to git, Vercel auto-deploys
git push origin main
```

---

## 🔧 Common Issues & Solutions

### Issue: Prisma Client errors

```bash
# Solution: Regenerate Prisma Client
npx prisma generate
```

### Issue: Database connection fails

```bash
# Check DATABASE_URL format:
postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Test connection:
npx prisma db push
```

### Issue: NextAuth.js auth not working

1. Check `NEXTAUTH_SECRET` is set and at least 32 characters
2. Check `NEXTAUTH_URL` matches your domain
3. Verify environment variables are loaded correctly

### Issue: Stripe webhooks not received

```bash
# For local development, use Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This gives you a webhook secret starting with whsec_
# Add it to .env as STRIPE_WEBHOOK_SECRET
```

### Issue: TypeScript errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Database Schema Overview

```
Organizations (Law Firms)
├── Users (Lawyers, Staff)
├── Clients
│   └── Cases
│       ├── Documents
│       ├── Time Entries
│       ├── Tasks
│       └── Notes
├── Invoices
│   ├── Time Entries
│   └── Expenses
└── Audit Logs
```

---

## 🎨 Adding New Pages

### Example: Adding a Reports page

1. **Create page file:**
```typescript
// app/(dashboard)/reports/page.tsx
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function ReportsPage() {
  const session = await auth()
  
  // Fetch data
  const reports = await db.case.findMany({
    where: { organization: { users: { some: { id: session.user.id } } } }
  })
  
  return (
    <div>
      <h1>Reports</h1>
      {/* Your UI here */}
    </div>
  )
}
```

2. **Add to navigation:**
```typescript
// components/nav.tsx
<Link href="/reports">Reports</Link>
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User sign-up flow
- [ ] Create organization
- [ ] Add client
- [ ] Create case
- [ ] Upload document
- [ ] Track time
- [ ] Generate invoice
- [ ] Test subscription upgrade
- [ ] Test AI features (PRO/Enterprise)

### Test Stripe Payments

Use these test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## 📈 Monitoring & Analytics

### Vercel Analytics

```bash
# Already configured in package.json
# View at: vercel.com/your-project/analytics
```

### Error Tracking (Optional - Sentry)

```bash
npm install @sentry/nextjs

# Follow setup wizard:
npx @sentry/wizard@latest -i nextjs
```

---

## 🔐 Security Checklist

- [x] All documents encrypted at rest
- [x] HTTPS enforced (automatic with Vercel)
- [x] 2FA enabled in NextAuth.js
- [x] Row-level security in database
- [x] Audit logging enabled
- [ ] Regular security audits (schedule)
- [ ] Backup strategy (configure)
- [ ] Incident response plan (create)

---

## 📚 Next Steps

1. **Complete MVP features** (follow PRODUCT_PLAN.md timeline)
2. **Croatian localization** - Add translations
3. **Create documentation** - User guides and API docs
4. **Beta testing** - Recruit 3-5 law firms
5. **Marketing website** - Create landing pages
6. **Legal compliance review** - Hire Croatian legal consultant
7. **Insurance** - Get professional liability insurance
8. **Launch!** 🚀

---

## 💡 Tips for Success

1. **Start small**: Begin with BASIC tier, add PRO/ENTERPRISE features later
2. **Get feedback early**: Talk to lawyers before building too much
3. **Focus on security**: This is legal data - security is paramount
4. **Document everything**: Good docs = fewer support requests
5. **Iterate quickly**: Launch MVP, learn, improve

---

## 📞 Getting Help

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **NextAuth.js**: [next-auth.js.org](https://next-auth.js.org)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

---

Good luck building iLegal! 🚀⚖️
