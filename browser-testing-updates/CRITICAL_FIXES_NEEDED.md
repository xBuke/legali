# Critical Fixes Needed for iLegal Application

## Priority 1: Database Connection Issues

### Problem
The application is experiencing 500 errors on authentication endpoints, likely due to database connectivity issues.

### Root Cause Analysis
1. **Environment Variables**: Missing or incorrect DATABASE_URL/DIRECT_URL
2. **Database Access**: PostgreSQL database may not be accessible from Vercel
3. **Connection Pooling**: Possible connection pool exhaustion

### Immediate Fixes Required

#### 1. Verify Environment Variables in Vercel
```bash
# Check these variables in Vercel dashboard:
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://i-legal-weld.vercel.app
```

#### 2. Database Connection Test
Create a simple health check endpoint to test database connectivity:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected', error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3. Enhanced Error Logging
Update the custom-login route to provide better error information:

```typescript
// In app/api/auth/custom-login/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Custom login error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return more specific error information in development
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

## Priority 2: Authentication Flow Testing

### Test User Creation
Create a test user to verify the complete authentication flow:

```sql
-- Insert test user (run this in your PostgreSQL database)
INSERT INTO users (
  id, email, password, firstName, lastName, role, 
  isActive, organizationId, createdAt, updatedAt
) VALUES (
  'test-user-1',
  'test@example.com',
  '$2a$10$example_hashed_password', -- Use bcrypt to hash 'testpassword123'
  'Test',
  'User',
  'LAWYER',
  true,
  'test-org-1',
  NOW(),
  NOW()
);

-- Create test organization
INSERT INTO organizations (
  id, name, subscriptionTier, subscriptionStatus, 
  storageLimit, createdAt, updatedAt
) VALUES (
  'test-org-1',
  'Test Law Firm',
  'BASIC',
  'TRIAL',
  53687091200,
  NOW(),
  NOW()
);
```

## Priority 3: Monitoring and Debugging

### Add Request Logging
Implement request logging to track API calls:

```typescript
// middleware.ts - Add this to existing middleware
export function middleware(request: NextRequest) {
  // Log API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`API Request: ${request.method} ${request.nextUrl.pathname}`, {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.ip
    });
  }
  
  // ... existing middleware code ...
}
```

### Database Connection Monitoring
Add connection monitoring to the database configuration:

```typescript
// lib/db.ts - Enhanced version
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Add connection health check
export async function checkDatabaseConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      connected: false, 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const prisma = db
export default db
```

## Testing Checklist

### Before Deployment
- [ ] Verify all environment variables are set in Vercel
- [ ] Test database connection with health check endpoint
- [ ] Create test user and verify login flow
- [ ] Check Vercel function logs for errors
- [ ] Test both sign-in and sign-up flows

### After Deployment
- [ ] Monitor error rates in Vercel dashboard
- [ ] Test with real user credentials
- [ ] Verify 2FA functionality (if enabled)
- [ ] Check session management
- [ ] Test password reset flow

## Emergency Rollback Plan
If issues persist:
1. Check Vercel deployment logs
2. Verify database is accessible from Vercel
3. Consider temporary maintenance page
4. Contact database provider if needed
5. Review recent code changes that might have caused issues
