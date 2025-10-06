# Environment Setup Guide for iLegal Application

## Current Environment Issues

Based on the browser testing, the application is experiencing 500 errors on authentication endpoints. This is likely due to missing or incorrect environment variables in the Vercel deployment.

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database URL (Primary)
DATABASE_URL="postgresql://username:password@host:port/database"

# Direct Database URL (for migrations)
DIRECT_URL="postgresql://username:password@host:port/database"
```

### NextAuth Configuration
```bash
# NextAuth Secret (minimum 32 characters)
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-chars"

# NextAuth URL (production)
NEXTAUTH_URL="https://i-legal-weld.vercel.app"
```

### Application Configuration
```bash
# Public App URL
NEXT_PUBLIC_APP_URL="https://i-legal-weld.vercel.app"

# Node Environment
NODE_ENV="production"
```

### Optional Services (if used)
```bash
# Stripe (for payments)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Vercel Blob (for file storage)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."
```

## Vercel Environment Setup

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your iLegal project
3. Go to Settings → Environment Variables

### Step 2: Add Required Variables
Add each environment variable with the following settings:
- **Environment**: Production (and Preview if needed)
- **Value**: Your actual configuration value

### Step 3: Database Setup
If using Vercel Postgres:
1. Go to Storage tab in Vercel dashboard
2. Create a new Postgres database
3. Copy the connection strings to your environment variables
4. Run database migrations

### Step 4: Redeploy
After adding environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Database Migration Commands

### Local Development
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### Production (Vercel)
```bash
# The migrations should run automatically during deployment
# If not, you can run them manually:
npx prisma migrate deploy
```

## Verification Steps

### 1. Health Check Endpoint
Create and test a health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Test environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### 2. Test Authentication
After setting up environment variables:
1. Visit: `https://i-legal-weld.vercel.app/api/health`
2. Check if database connection is working
3. Test sign-in with valid credentials
4. Monitor Vercel function logs

## Common Issues and Solutions

### Issue: "Database connection failed"
**Solution**: 
- Verify DATABASE_URL is correct
- Check if database allows connections from Vercel IPs
- Ensure database is not paused (if using Vercel Postgres)

### Issue: "NextAuth configuration error"
**Solution**:
- Verify NEXTAUTH_SECRET is set and at least 32 characters
- Check NEXTAUTH_URL matches your domain exactly
- Ensure no trailing slashes in URLs

### Issue: "Prisma client not generated"
**Solution**:
- Add `npx prisma generate` to your build script
- Ensure Prisma schema is valid
- Check if DATABASE_URL is accessible during build

## Build Script Configuration

Update your `package.json` build script:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## Monitoring Setup

### Vercel Analytics
1. Enable Vercel Analytics in your project
2. Monitor function execution times
3. Check error rates and logs

### Database Monitoring
1. Monitor database connection pool usage
2. Set up alerts for connection failures
3. Track query performance

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's environment variable encryption
- Rotate secrets regularly
- Use different secrets for different environments

### Database Security
- Use connection pooling
- Enable SSL connections
- Restrict database access to Vercel IPs
- Regular security updates

## Troubleshooting Commands

### Check Environment Variables
```bash
# In Vercel CLI
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

### Database Connection Test
```bash
# Test connection locally
npx prisma db pull

# Check database status
npx prisma db status
```

### Logs and Debugging
```bash
# View Vercel function logs
vercel logs

# Check specific function logs
vercel logs --function=api/auth/custom-login
```
