# Quick Fix Implementation Guide

## Immediate Actions to Fix Authentication Issues

### 1. Create Health Check Endpoint

Create a new file to test database connectivity:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### 2. Enhanced Error Logging for Custom Login

Update the custom login route with better error handling:

```typescript
// app/api/auth/custom-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifyTwoFactorCode, validateTwoFactorCode } from '@/lib/two-factor';
import { logAuthActivity } from '@/lib/activity-logger';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password, twoFactorCode, sessionId } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i lozinka su obavezni' },
        { status: 400 }
      );
    }

    // Test database connection first
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Greška pri povezivanju s bazom podataka' },
        { status: 500 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.password) {
      await logAuthActivity(
        'LOGIN_FAILED',
        'unknown',
        'unknown',
        { email, reason: 'User not found' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

    // Verify password
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      await logAuthActivity(
        'LOGIN_FAILED',
        user.id,
        user.organizationId,
        { email, reason: 'Invalid password' },
        request
      );
      return NextResponse.json(
        { error: 'Neispravni podaci za prijavu' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Vaš račun je deaktiviran' },
        { status: 401 }
      );
    }

    // Handle 2FA flow (existing code continues...)
    // ... rest of the existing 2FA logic ...

  } catch (error) {
    console.error('Custom login error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    });
    
    // Return more specific error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Greška pri prijavi',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Greška pri prijavi' },
      { status: 500 }
    );
  }
}
```

### 3. Database Connection Enhancement

Update the database configuration with better error handling:

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with connection monitoring
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'pretty',
})

// Connection health check function
export async function checkDatabaseConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { 
      connected: true, 
      timestamp: new Date().toISOString(),
      url: process.env.DATABASE_URL ? 'configured' : 'missing'
    };
  } catch (error) {
    return { 
      connected: false, 
      error: error.message, 
      timestamp: new Date().toISOString(),
      url: process.env.DATABASE_URL ? 'configured' : 'missing'
    };
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect();
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const prisma = db
export default db
```

### 4. Test User Creation Script

Create a script to add a test user for verification:

```typescript
// scripts/create-test-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create test organization first
    const organization = await prisma.organization.upsert({
      where: { id: 'test-org-1' },
      update: {},
      create: {
        id: 'test-org-1',
        name: 'Test Law Firm',
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'TRIAL',
        storageLimit: BigInt(53687091200), // 50GB
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'test-user-1',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'LAWYER',
        isActive: true,
        organizationId: organization.id,
      },
    });

    console.log('Test user created successfully:', {
      email: user.email,
      organization: organization.name,
      userId: user.id
    });

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
```

### 5. Environment Variables Checklist

Create a checklist for required environment variables:

```bash
# Required for basic functionality
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=https://i-legal-weld.vercel.app
NEXT_PUBLIC_APP_URL=https://i-legal-weld.vercel.app
NODE_ENV=production
```

## Implementation Steps

### Step 1: Add Health Check
1. Create `app/api/health/route.ts` with the code above
2. Deploy and test: `https://i-legal-weld.vercel.app/api/health`

### Step 2: Update Custom Login
1. Update `app/api/auth/custom-login/route.ts` with enhanced error handling
2. Deploy and test authentication

### Step 3: Create Test User
1. Run the test user creation script
2. Test login with `test@example.com` / `testpassword123`

### Step 4: Verify Environment Variables
1. Check Vercel dashboard for all required environment variables
2. Redeploy if any variables were missing

### Step 5: Monitor and Test
1. Check Vercel function logs
2. Test complete authentication flow
3. Verify database connectivity

## Testing Commands

```bash
# Test health endpoint
curl https://i-legal-weld.vercel.app/api/health

# Test authentication (replace with actual credentials)
curl -X POST https://i-legal-weld.vercel.app/api/auth/custom-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Check Vercel logs
vercel logs --function=api/auth/custom-login
```

## Expected Results

After implementing these fixes:
1. Health check should return `{"status":"healthy","database":"connected"}`
2. Authentication should work with valid credentials
3. Error messages should be more informative
4. Database connection should be stable

## Rollback Plan

If issues persist:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test database connection independently
4. Consider reverting to previous working deployment
