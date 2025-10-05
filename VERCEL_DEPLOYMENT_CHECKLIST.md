# Vercel Deployment Checklist

## ✅ Pre-Deployment Fixes Applied

### 1. **Database Configuration (CRITICAL FIX)**
- ✅ **FIXED**: Changed from SQLite to PostgreSQL for production
- ✅ **FIXED**: Added DIRECT_URL for connection pooling
- ✅ **FIXED**: Updated Prisma schema for production deployment
- ✅ **FIXED**: Added proper database migration scripts

### 2. **Environment Variables**
- ✅ **FIXED**: Created comprehensive `env.example` template
- ✅ **FIXED**: Added all required and optional variables
- ✅ **FIXED**: Documented production vs development configurations
- ✅ **FIXED**: Added proper fallbacks for missing variables

### 3. **Build Configuration**
- ✅ **FIXED**: Updated `package.json` with proper build scripts
- ✅ **FIXED**: Added `vercel-build` script for deployment
- ✅ **FIXED**: Updated Vercel configuration with framework settings
- ✅ **FIXED**: Added proper Prisma generation in build process

### 4. **Vercel Configuration**
- ✅ **FIXED**: Updated `vercel.json` with proper build commands
- ✅ **FIXED**: Added framework specification
- ✅ **FIXED**: Configured proper install and build commands
- ✅ **FIXED**: Maintained 30-second function timeout

### 5. **Database Query Optimization**
- Added query limits (`take: 1000`) to prevent timeouts
- Optimized conditional includes in Prisma queries
- Added proper error handling for all database operations
- Limited monthly trends to 6 months instead of 12

### 6. **Request Handling**
- Added JSON parsing error handling for all API routes
- Implemented proper input validation
- Added graceful fallbacks for failed operations

### 7. **Error Handling**
- Added try-catch blocks for all database operations
- Implemented graceful degradation for failed queries
- Added proper error logging

## 🔧 Required Environment Variables

### Essential (Required for Production)
```bash
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### Stripe Integration (Required for billing features)
```bash
STRIPE_SECRET_KEY="sk_live_..."  # Use live keys for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### Optional (Features will work without these)
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

## 🚀 Deployment Steps

### **CRITICAL: Database Setup First**
1. **Create Vercel Postgres Database:**
   ```bash
   vercel postgres create ilegal-db
   vercel env pull .env.local
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - Copy values from `.env.local` to Vercel environment variables
   - Ensure `DATABASE_URL` and `DIRECT_URL` are set
   - Set `NEXTAUTH_SECRET` (generate a secure random string)
   - Set `NEXTAUTH_URL` to your Vercel domain

3. **Deploy** - The build process will:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build Next.js application
   - Deploy to Vercel

4. **Post-Deployment:**
   - Verify database connection
   - Test user registration/login
   - Check API endpoints

## 📊 Performance Optimizations

- **Function Timeout**: 30 seconds (configured in vercel.json)
- **Database**: PostgreSQL with connection pooling
- **Query Limits**: 1000 records max per query
- **Error Handling**: Graceful fallbacks for all operations
- **Build Process**: Optimized with proper Prisma generation

## 🔍 Monitoring

- All errors are logged to console
- Database query failures have fallbacks
- Rate limiting is optional (graceful degradation)
- Security events are logged

## ✅ Post-Deployment Verification

1. Check that all API routes respond correctly
2. Verify database connections work
3. Test authentication flows
4. Confirm analytics data loads
5. Check Stripe integration (if configured)

## 🛠️ Troubleshooting

### Common Issues:
- **Database Connection**: 
  - Ensure `DATABASE_URL` and `DIRECT_URL` are set
  - Verify PostgreSQL connection strings are correct
  - Check if database exists and is accessible
- **Authentication**: 
  - Check `NEXTAUTH_SECRET` is set (minimum 32 characters)
  - Verify `NEXTAUTH_URL` matches your domain exactly
  - Ensure cookies are working (check domain settings)
- **Build Failures**: 
  - Check Prisma client generation in build logs
  - Verify all environment variables are set
  - Check for TypeScript compilation errors
- **Stripe**: 
  - Verify all Stripe environment variables are set
  - Use live keys for production (not test keys)
  - Check webhook endpoint configuration

### Logs:
- Check Vercel function logs for errors
- Monitor database query performance
- Watch for timeout issues in analytics routes
- Check Prisma migration logs
