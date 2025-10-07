# 🚀 iLegal - Quick Start Guide

Get up and running in 15 minutes!

## ✅ What You Have Right Now

Your project includes:
- ✅ Complete database schema (18 tables for cases, clients, documents, billing)
- ✅ Authentication setup (NextAuth.js v5)
- ✅ Payment processing (Stripe integration ready)
- ✅ AI features setup (OpenAI integration ready)
- ✅ Security (encryption, audit logging)
- ✅ Beautiful landing page in Croatian
- ✅ Complete documentation (1,500+ lines)

**Foundation is 100% complete. Now you just need to build the features!**

---

## 🎯 Your Path to Launch

```
Week 1-2:  Authentication + Core Features  → Usable by 1 lawyer
Week 3-4:  Time Tracking + Invoicing      → Usable by small firm
Week 5:    Subscription Management        → Can charge customers
Week 6-7:  AI Document Analyzer (PRO)     → Competitive advantage
Week 8-9:  AI Chatbot (ENTERPRISE)        → Premium offering
Week 10-13: Polish + Launch               → 🚀 Revenue!
```

---

## 📝 Step 1: Install Dependencies (2 minutes)

```bash
# Make sure you're in the project directory
cd ilegalclaude

# Install all dependencies
npm install
```

This will install:
- Next.js, React, TypeScript
- Prisma (database)
- NextAuth.js (authentication)
- Stripe (payments)
- OpenAI (AI features)
- UI components (shadcn/ui)

---

## 🔑 Step 2: Get Your API Keys (10 minutes)

### 2.1 NextAuth.js (Authentication) - FREE
1. NextAuth.js is already configured
2. Sign up / Log in
3. Create new application: "iLegal"
4. Copy these keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### 2.2 Stripe (Payments) - FREE (Test Mode)
1. Go to [stripe.com](https://stripe.com)
2. Sign up / Log in
3. Make sure you're in **Test mode** (toggle in top right)
4. Go to "Developers" → "API keys"
5. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2.3 OpenAI (AI Features) - PAID (~$5 to start)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. Add $5-10 credit to your account
4. Go to "API keys"
5. Create new key and copy it (starts with `sk-`)

### 2.4 Vercel (Database & Hosting) - FREE
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. We'll set this up later for database

---

## ⚙️ Step 3: Configure Environment (2 minutes)

1. **Create `.env` file**:
```bash
# On Windows (PowerShell):
copy .env.example .env

# On Mac/Linux:
cp .env.example .env
```

2. **Generate encryption key**:
```bash
# On Windows (PowerShell):
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)

# On Mac/Linux:
openssl rand -base64 32
```

3. **Edit `.env` file** and add your keys:

```env
# Database (we'll set this up next)
DATABASE_URL="postgresql://..."

# NextAuth.js (already configured)
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (from step 2.2)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE

# OpenAI (from step 2.3)
OPENAI_API_KEY=sk-YOUR_KEY_HERE

# Encryption (from step 3.2)
ENCRYPTION_KEY=YOUR_GENERATED_KEY_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Step 4: Set Up Database (3 minutes)

### Option A: Vercel Postgres (Recommended - Easy)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Create database
vercel postgres create ilegal-db

# This will give you a DATABASE_URL - copy it to .env

# Push database schema
npm run db:push
```

### Option B: Local PostgreSQL (For offline development)

1. Install PostgreSQL from [postgresql.org](https://postgresql.org)
2. Create database:
   ```bash
   createdb ilegal
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/ilegal"
   ```
4. Push schema:
   ```bash
   npm run db:push
   ```

---

## 🎉 Step 5: Run Your App!

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see your beautiful landing page! 🎊

---

## 🛠️ What to Build Next

### This Week: Authentication Flow

**Goal**: Let users sign up, create an organization, and see a dashboard.

#### Day 1-2: Sign Up/In Pages

**Note**: Sign-up and sign-in pages are already created using NextAuth.js

**Test**: Click "Prijava" or "Započni besplatno" on landing page

#### Day 3-4: Onboarding Flow

**Create**: `app/(dashboard)/onboarding/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const response = await fetch('/api/organizations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: orgName,
        email: user?.emailAddresses[0]?.emailAddress,
      }),
    })

    if (response.ok) {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Dobrodošli u iLegal!</h1>
          <p className="mt-2 text-muted-foreground">
            Kreirajmo vašu odvjetničku kancelariju
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Naziv kancelarije
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="npr. Odvjetnička kancelarija Horvat"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Kreiranje...' : 'Nastavi'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Create**: `app/api/organizations/create/route.ts`
```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSubscriptionLimits } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email } = await request.json()

    // Create organization with TRIAL status
    const organization = await db.organization.create({
      data: {
        name,
        email,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        storageLimit: getSubscriptionLimits('BASIC').storage,
      },
    })

    // Create user as ADMIN
    const user = await db.user.create({
      data: {
        email: session.user.email || email,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ')[1] || '',
        role: 'ADMIN',
        organizationId: organization.id,
      },
    })

    return NextResponse.json({ organization, user })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
```

#### Day 5: Dashboard Layout

**Create**: `app/(dashboard)/layout.tsx`
```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  })

  // If user doesn't have organization, redirect to onboarding
  if (!user) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - We'll build this next */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-6">
          <h2 className="font-bold text-lg">iLegal</h2>
          <p className="text-sm text-muted-foreground">{user.organization.name}</p>
        </div>
        <nav className="space-y-1 px-3">
          <a href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-accent">
            Dashboard
          </a>
          <a href="/clients" className="block px-3 py-2 rounded-md hover:bg-accent">
            Klijenti
          </a>
          <a href="/cases" className="block px-3 py-2 rounded-md hover:bg-accent">
            Predmeti
          </a>
          <a href="/documents" className="block px-3 py-2 rounded-md hover:bg-accent">
            Dokumenti
          </a>
          <a href="/time-tracking" className="block px-3 py-2 rounded-md hover:bg-accent">
            Evidencija vremena
          </a>
          <a href="/invoices" className="block px-3 py-2 rounded-md hover:bg-accent">
            Računi
          </a>
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

**Create**: `app/(dashboard)/dashboard/page.tsx`
```typescript
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const session = await auth()
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  })

  const stats = await db.$transaction([
    db.client.count({ where: { organizationId: user!.organizationId } }),
    db.case.count({ where: { organizationId: user!.organizationId } }),
    db.document.count({ where: { organizationId: user!.organizationId } }),
  ])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Dobro došli, {user?.firstName}!
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <div className="text-2xl font-bold">{stats[0]}</div>
          <div className="text-muted-foreground">Klijenti</div>
        </div>
        <div className="p-6 border rounded-lg">
          <div className="text-2xl font-bold">{stats[1]}</div>
          <div className="text-muted-foreground">Predmeti</div>
        </div>
        <div className="p-6 border rounded-lg">
          <div className="text-2xl font-bold">{stats[2]}</div>
          <div className="text-muted-foreground">Dokumenti</div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nedavne aktivnosti</h2>
        <p className="text-muted-foreground">Trenutno nema aktivnosti</p>
      </div>
    </div>
  )
}
```

**Test your progress**:
1. Go to http://localhost:3000
2. Click "Započni besplatno"
3. Sign up with email
4. Complete onboarding
5. See your dashboard! 🎉

---

## 📚 Next: Build Core Features

Once your authentication works, follow **NEXT_STEPS.md** to build:
- Week 2: Clients & Cases
- Week 3: Documents & Time Tracking
- Week 4: Invoicing

---

## 🆘 Common Issues

### "Module not found" errors
```bash
npm install
npx prisma generate
```

### Database connection fails
```bash
# Check your DATABASE_URL in .env
# Make sure PostgreSQL is running
npm run db:push
```

### NextAuth auth not working
- Check `NEXTAUTH_SECRET` in `.env`
- Verify `NEXTAUTH_URL` matches your domain
- Restart dev server: `npm run dev`

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📖 Documentation Reference

- **Product Overview**: `PRODUCT_PLAN.md`
- **Detailed Setup**: `IMPLEMENTATION_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **Development Plan**: `NEXT_STEPS.md`
- **File Structure**: `DIRECTORY_STRUCTURE.md`
- **Quick Overview**: `PROJECT_SUMMARY.md`

---

## 🎯 Your Mission This Week

- [ ] Install dependencies
- [ ] Get API keys
- [ ] Set up database
- [ ] Run app successfully
- [ ] Create sign-up/sign-in pages
- [ ] Build onboarding flow
- [ ] Create dashboard layout
- [ ] See stats on dashboard

**When you complete this, you'll have a working authenticated app!**

Then move to clients and cases next week.

---

## 💪 You've Got Everything You Need!

- ✅ Complete database schema
- ✅ All utilities and helpers
- ✅ Security built-in
- ✅ Payment integration ready
- ✅ AI features ready
- ✅ Beautiful UI components
- ✅ Comprehensive documentation

**Just follow the steps and build feature by feature.**

**You've got this!** 🚀

---

**Questions?** Check the docs or start building and learn as you go!

**Ready?** Run `npm install` and let's go! 💻
