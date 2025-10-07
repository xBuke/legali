# 🚀 iLegal Deployment Guide

Complete guide for deploying iLegal to Vercel with PostgreSQL.

## 📋 Quick Start

1. **Create PostgreSQL database** (Vercel Postgres, Supabase, or Railway)
2. **Set environment variables** in Vercel dashboard
3. **Push to GitHub** - automatic deployment
4. **Verify** deployment and test features

---

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Create database
vercel postgres create ilegal-db

# Pull environment variables
vercel env pull .env.local
```

### Option 2: External Database

**Supabase** (Recommended)
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy connection strings

**Railway**
1. Create database at [railway.app](https://railway.app)
2. Copy connection string

**Neon**
1. Create database at [neon.tech](https://neon.tech)
2. Copy connection string

---

## 🔧 Environment Variables

### Required (Production)

```bash
# Database
DATABASE_URL="postgres://user:pass@host:6543/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgres://user:pass@host:5432/db?sslmode=require"

# Authentication - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Stripe (for billing)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### Optional Features

```bash
# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# AI Document Analysis
OPENAI_API_KEY="sk-..."

# Error Monitoring
SENTRY_DSN="https://..."
```

---

## 🚀 Deployment Process

### Automatic (Recommended)

1. **Connect GitHub to Vercel**
   - Import repository at [vercel.com](https://vercel.com)
   - Vercel deploys on every push to main

2. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables above

3. **Deploy**
   - Push to main branch
   - Vercel builds and deploys automatically

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## ✅ Post-Deployment Checklist

### 1. Verify Application Health
- [ ] Visit deployed URL
- [ ] Test user registration
- [ ] Test login flow
- [ ] Check database connectivity

### 2. Test Core Features
- [ ] Create a client
- [ ] Create a case
- [ ] Upload a document
- [ ] Record time entry
- [ ] Generate invoice

### 3. Configure Integrations
- [ ] Set up Stripe webhooks (if using billing)
- [ ] Configure custom domain (if applicable)
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring

### 4. Security Review
- [ ] Verify all environment variables are encrypted
- [ ] Check SSL certificate is active
- [ ] Test authentication flows
- [ ] Review API security settings

---

## 🛠️ Troubleshooting

### Database Connection Issues

**Problem:** `P1000: Authentication failed`
**Solution:**
- Verify DATABASE_URL and DIRECT_URL are correct
- Check password doesn't have typos (especially case-sensitive)
- Ensure database allows connections from Vercel IPs

**Problem:** `P1001: Can't reach database server`
**Solution:**
- Check database is running
- Verify SSL mode is correct
- Test connection from local environment

### Build Failures

**Problem:** `Module not found` errors
**Solution:**
- Clear Vercel build cache
- Redeploy with "Use existing Build Cache" = OFF
- Check all files are committed to git

**Problem:** Prisma generation fails
**Solution:**
- Ensure DATABASE_URL is set during build
- Check prisma schema is valid
- Verify `vercel-build` script in package.json

### Authentication Issues

**Problem:** Can't login after deployment
**Solution:**
- Verify NEXTAUTH_SECRET is set (minimum 32 characters)
- Check NEXTAUTH_URL matches deployed domain exactly
- Clear browser cookies and try again

**Problem:** Infinite redirect loops
**Solution:**
- Ensure NEXTAUTH_URL has correct protocol (https://)
- Check middleware configuration
- Verify no trailing slashes in URLs

### Function Timeouts

**Problem:** API routes timing out
**Solution:**
- Check `vercel.json` has `maxDuration: 30`
- Optimize database queries
- Add pagination for large datasets
- Use database indexes

---

## 📊 Performance Optimization

### Database
- Connection pooling via Prisma (automatic)
- All queries have proper indexes
- Pagination for large result sets
- Query limits (max 1000 records)

### API Routes
- 30-second timeout configured
- Rate limiting (optional)
- Input validation with Zod
- Proper error handling

### Frontend
- Next.js App Router with Server Components
- Image optimization
- Static asset CDN
- Code splitting

---

## 🔒 Security Best Practices

### Environment Variables
- Never commit .env files
- Use Vercel's encryption
- Rotate secrets regularly
- Use different secrets per environment

### Database
- Enable SSL for production
- Use connection pooling
- Implement proper access controls
- Regular backups

### API Security
- Rate limiting recommended
- Input validation on all endpoints
- Authentication on protected routes
- CORS properly configured

---

## 📈 Monitoring

### Vercel Dashboard
- Function execution times
- Error rates
- Bandwidth usage
- Deployment history

### Database Monitoring
- Query performance
- Connection pool usage
- Storage utilization
- Backup status

### Application Metrics
- User authentication success rate
- API response times
- Document uploads
- Invoice generation

---

## 🆘 Support Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://www.prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## 🎉 Success!

Your iLegal application is now live and ready for production use.

**Next steps:**
- Monitor application performance
- Set up automated backups
- Configure error alerts
- Plan regular maintenance windows
