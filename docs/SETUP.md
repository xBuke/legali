# 🔧 iLegal Setup Guide

Complete setup instructions for development and production environments.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Stripe account (for billing features)
- Git installed

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/ilegal.git
cd ilegal

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb ilegal_dev

# Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/ilegal_dev"
DIRECT_URL="postgresql://user:password@localhost:5432/ilegal_dev"
```

### Cloud Database Options

**Supabase (Recommended)**
1. Create project at [supabase.com](https://supabase.com)
2. Copy connection strings from Settings → Database
3. Add to .env.local

**Railway**
1. Create database at [railway.app](https://railway.app)
2. Copy connection string
3. Add to .env.local

**Vercel Postgres**
```bash
vercel postgres create ilegal-dev
vercel env pull .env.local
```

---

## 💳 Stripe Integration Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Toggle to **Test Mode** (development)

### 2. Get API Keys

1. Go to **Developers** → **API keys**
2. Copy keys to .env.local:

```bash
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Create Products

Create three subscription products in Stripe Dashboard:

**Basic Plan**
- Name: iLegal Basic
- Price: €147/month
- Description: Up to 3 users
- Copy Price ID → `STRIPE_BASIC_PRICE_ID`

**Pro Plan**
- Name: iLegal Pro
- Price: €297/month
- Description: Up to 6 users + AI features
- Copy Price ID → `STRIPE_PRO_PRICE_ID`

**Enterprise Plan**
- Name: iLegal Enterprise
- Price: €497/month
- Description: Unlimited users + advanced features
- Copy Price ID → `STRIPE_ENTERPRISE_PRICE_ID`

### 4. Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Add endpoint: `http://localhost:3000/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

### 5. Test with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

---

## 🔐 Authentication Setup

### Generate NextAuth Secret

```bash
# Generate secure random string
openssl rand -base64 32
```

Add to .env.local:
```bash
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### First Admin User

After running the app:
1. Visit http://localhost:3000/sign-up
2. Register first user (becomes admin automatically)
3. Additional users inherit permissions from first user's organization

---

## 📁 File Storage Setup (Optional)

### Vercel Blob

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Create Blob store
vercel blob create ilegal-storage

# Pull token
vercel env pull .env.local
```

Add to .env.local:
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### Alternative: Local Storage

For development without Vercel Blob:
- Files stored in `/uploads` directory
- Not recommended for production

---

## 🚦 Rate Limiting Setup (Optional)

### Upstash Redis

1. Create database at [upstash.com](https://upstash.com)
2. Copy connection details to .env.local:

```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Without rate limiting:
- Application works normally
- No request limits enforced

---

## 🤖 AI Features Setup (Optional)

### OpenAI Integration

For AI-powered document analysis:

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to .env.local:

```bash
OPENAI_API_KEY="sk-..."
```

Features enabled with OpenAI:
- Document summarization
- Key phrase extraction
- Entity recognition
- Risk assessment

---

## 🛠️ Development Tools

### Prisma Studio

View and edit database:
```bash
npm run db:studio
```

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Push schema changes (dev only)
npm run db:push

# Seed database
npm run db:seed
```

### Lint & Type Check

```bash
# Run ESLint
npm run lint

# Type check
npx tsc --noEmit
```

---

## 🧪 Testing

### Test User Credentials

After seeding database:
- Email: `admin@ilegal.app`
- Password: `Admin123!`

### Create Test Data

```bash
# Run seed script
node scripts/create-test-user.js
```

---

## 📱 Environment Variables Reference

### Required

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="32-char-random-string"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Stripe (for billing)

```bash
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### Optional Features

```bash
# File Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# AI Features
OPENAI_API_KEY="sk-..."

# Monitoring
SENTRY_DSN="https://..."
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** Can't connect to database
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure database exists

### Prisma Issues

**Error:** Prisma Client not generated
```bash
npx prisma generate
```

**Error:** Schema out of sync
```bash
npx prisma migrate dev
```

### Stripe Webhook Issues

**Error:** Webhook signature verification failed
- Check STRIPE_WEBHOOK_SECRET is correct
- Ensure webhook endpoint URL matches
- Use Stripe CLI for local testing

### Port Already in Use

**Error:** Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

---

## 📚 Additional Resources

- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs:** [prisma.io/docs](https://www.prisma.io/docs)
- **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)
- **NextAuth Docs:** [next-auth.js.org](https://next-auth.js.org)

---

## ✅ Setup Complete!

Your development environment is ready. Next steps:

1. Start development server: `npm run dev`
2. Open Prisma Studio: `npm run db:studio`
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for codebase overview
4. Review [API documentation](./API.md) for endpoint details
