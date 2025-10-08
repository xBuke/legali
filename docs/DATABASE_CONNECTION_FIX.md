# 🔧 Database Connection Fix Guide

## Problem
Error: `P1001: Can't reach database server at aws-1-eu-central-1.pooler.supabase.com:5432`

This error occurs when the database connection string is using the wrong port for Supabase.

## Root Cause
Supabase uses different ports for different types of connections:
- **Port 5432**: Direct connections (for migrations, schema changes)
- **Port 6543**: Pooled connections (for application queries)

## Solution

### 1. Update Environment Variables in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables and update:

#### For Supabase:
```bash
# Pooled connection (for application queries)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

#### For Vercel Postgres:
```bash
# Pooled connection
DATABASE_URL="postgresql://username:password@host:6543/database?pgbouncer=true&connection_limit=1"

# Direct connection  
DIRECT_URL="postgresql://username:password@host:5432/database"
```

### 2. Key Points

- **DATABASE_URL** must use port **6543** for pooled connections
- **DIRECT_URL** must use port **5432** for direct connections
- Add `?pgbouncer=true&connection_limit=1` to the pooled connection string
- Replace `[YOUR_PASSWORD]` with your actual database password

### 3. Verify the Fix

After updating the environment variables:

1. **Redeploy your application** (Vercel will automatically redeploy)
2. **Test the connection** by visiting: `https://your-app.vercel.app/api/health/db`
3. **Check the logs** in Vercel dashboard for any remaining errors

### 4. Alternative: Use the Diagnostic Script

You can also run the diagnostic script locally (if you have the environment variables set):

```bash
npm run db:diagnose
```

This will:
- Check your current environment variables
- Analyze the connection strings
- Test the database connection
- Provide specific recommendations

## Common Issues

### Issue 1: Wrong Port in DATABASE_URL
**Error**: `P1001: Can't reach database server at host:5432`
**Fix**: Change DATABASE_URL to use port 6543

### Issue 2: Missing pgbouncer Parameters
**Error**: Connection timeouts or connection limit exceeded
**Fix**: Add `?pgbouncer=true&connection_limit=1` to DATABASE_URL

### Issue 3: Wrong Port in DIRECT_URL
**Error**: Migration failures
**Fix**: Ensure DIRECT_URL uses port 5432

### Issue 4: Incorrect Password
**Error**: `P1000: Authentication failed`
**Fix**: Verify the password in your database connection string

## Testing the Fix

1. **Health Check**: Visit `/api/health/db` endpoint
2. **User Registration**: Try creating a new user account
3. **Client Creation**: Test creating a new client
4. **Database Queries**: Verify all CRUD operations work

## Prevention

To avoid this issue in the future:

1. **Always use the correct ports** for Supabase connections
2. **Test locally** with the same connection strings before deploying
3. **Use the diagnostic script** when setting up new environments
4. **Document your connection strings** for team members

## Support

If you continue to have issues:

1. Check the Vercel function logs for detailed error messages
2. Verify your Supabase database is running and accessible
3. Ensure your IP is whitelisted (if using IP restrictions)
4. Contact Supabase support if the issue persists

---

**Note**: This fix applies specifically to Supabase connections. For other PostgreSQL providers, check their documentation for the correct connection parameters.
