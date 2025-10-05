# 🚀 iLegal - Vercel Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Critical Issues Fixed**
- [x] Database configuration updated to PostgreSQL for production
- [x] Environment variables template created
- [x] Vercel configuration optimized
- [x] Build scripts updated for proper Prisma handling
- [x] Security configurations reviewed

---

## 🗄️ **Database Setup (CRITICAL)**

### **Option 1: Vercel Postgres (Recommended)**

1. **Create Vercel Postgres Database:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project
   vercel link
   
   # Create Postgres database
   vercel postgres create ilegal-db
   ```

2. **Get Connection Strings:**
   ```bash
   # Pull environment variables
   vercel env pull .env.local
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project in Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:

   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

### **Option 2: External PostgreSQL (Supabase, Railway, etc.)**

1. **Create PostgreSQL database** on your preferred provider
2. **Get connection strings** and add to Vercel environment variables
3. **Ensure SSL is enabled** for production connections

---

## 🔧 **Environment Variables Setup**

### **Required Variables (Must Set):**
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Stripe (for billing features)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### **Optional Variables (Features work without these):**
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

## 🚀 **Deployment Steps**

### **1. Prepare Your Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

### **2. Deploy to Vercel**

**Option A: Automatic Deployment (Recommended)**
- Connect your GitHub repository to Vercel
- Vercel will automatically deploy on every push to main branch

**Option B: Manual Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### **3. Run Database Migrations**
```bash
# After deployment, run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

---

## 🔍 **Post-Deployment Verification**

### **1. Check Application Health**
- [ ] Visit your deployed URL
- [ ] Test user registration/login
- [ ] Verify database connections work
- [ ] Check API endpoints respond correctly

### **2. Test Critical Features**
- [ ] User authentication
- [ ] Database operations (create case, client, etc.)
- [ ] File uploads (if Blob storage configured)
- [ ] Stripe integration (if configured)

### **3. Monitor Performance**
- [ ] Check Vercel function logs
- [ ] Monitor database query performance
- [ ] Watch for timeout issues

---

## 🛠️ **Troubleshooting Common Issues**

### **Database Connection Issues**
```bash
# Check if DATABASE_URL is set correctly
vercel env ls

# Test database connection
npx prisma db pull
```

### **Build Failures**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - Prisma client generation failures
# - TypeScript compilation errors
```

### **Function Timeouts**
- Check `vercel.json` configuration
- Optimize database queries
- Add proper error handling

### **Authentication Issues**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure cookies are working (check domain settings)

---

## 📊 **Performance Optimization**

### **Database Optimization**
- All queries have proper indexes
- Pagination implemented for large datasets
- Connection pooling handled by Prisma

### **API Optimization**
- Rate limiting implemented (optional)
- Proper error handling and logging
- Request validation with Zod schemas

### **Frontend Optimization**
- Next.js App Router with Server Components
- Image optimization configured
- Static assets served via CDN

---

## 🔒 **Security Considerations**

### **Environment Variables**
- Never commit `.env` files to repository
- Use Vercel's environment variable encryption
- Rotate secrets regularly

### **Database Security**
- Use connection pooling
- Enable SSL for production connections
- Implement proper access controls

### **API Security**
- Rate limiting (optional but recommended)
- Input validation on all endpoints
- Proper authentication checks

---

## 📈 **Monitoring & Maintenance**

### **Vercel Analytics**
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track error rates

### **Database Monitoring**
- Monitor query performance
- Set up alerts for connection issues
- Regular backup verification

### **Application Monitoring**
- Set up error tracking (Sentry recommended)
- Monitor user authentication flows
- Track critical business metrics

---

## 🆘 **Support & Resources**

### **Vercel Documentation**
- [Vercel Deployment Guide](https://vercel.com/docs/deployments)
- [Vercel Postgres Setup](https://vercel.com/docs/storage/vercel-postgres)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

### **Prisma Documentation**
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Database Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

### **Next.js Documentation**
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ **Final Checklist**

Before going live:
- [ ] All environment variables set in Vercel
- [ ] Database migrations completed
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] Stripe webhooks configured (if using billing)
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Performance monitoring active

**🎉 Your iLegal application is now ready for production!**

