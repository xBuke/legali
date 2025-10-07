# Environment Variables Setup Guide

This guide explains how to configure environment variables for iLegal's Basic tier deployment.

## Quick Start

1. Copy `env.example` to `.env.local` for local development
2. Set up your database (SQLite for local, PostgreSQL for production)
3. Generate a secure NEXTAUTH_SECRET
4. Configure URLs for your environment
5. Deploy to Vercel with production variables

## Required Environment Variables

### Database Configuration

#### `DATABASE_URL`
- **Purpose**: Primary database connection string
- **Local Development**: `"file:./dev.db"` (SQLite)
- **Production**: PostgreSQL connection string from Vercel Postgres
- **Format**: `"postgresql://username:password@host:port/database"`

#### `DIRECT_URL` (Production Only)
- **Purpose**: Direct database connection for migrations
- **Local Development**: Not needed (SQLite)
- **Production**: Same as DATABASE_URL but for direct connections
- **Format**: `"postgresql://username:password@host:port/database"`

### Authentication

#### `NEXTAUTH_SECRET`
- **Purpose**: Secret key for NextAuth.js session encryption
- **Required**: Yes, minimum 32 characters
- **Generate Command**: `openssl rand -base64 32`
- **Example**: `"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"`

#### `NEXTAUTH_URL`
- **Purpose**: Base URL for NextAuth.js callbacks
- **Local Development**: `"http://localhost:3000"`
- **Production**: `"https://your-domain.vercel.app"`

### Application Configuration

#### `NEXT_PUBLIC_APP_URL`
- **Purpose**: Public-facing URL of your application
- **Local Development**: `"http://localhost:3000"`
- **Production**: `"https://your-domain.vercel.app"`

#### `NODE_ENV`
- **Purpose**: Node.js environment setting
- **Local Development**: `"development"`
- **Production**: `"production"`

## Setup Instructions

### 1. Local Development Setup

1. **Copy the environment template**:
   ```bash
   cp env.example .env.local
   ```

2. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and replace `"your-super-secret-key-here-min-32-chars"` in `.env.local`

3. **Verify your setup**:
   ```bash
   npm run dev
   ```

### 2. Production Setup (Vercel)

#### Database Setup
1. **Create Vercel Postgres Database**:
   - Go to your Vercel dashboard
   - Navigate to Storage → Create Database → Postgres
   - Choose a name and region
   - Click "Create"

2. **Get Connection Strings**:
   - In your Postgres database dashboard
   - Go to "Settings" → "Connection Pooling"
   - Copy the "Connection String" for `DATABASE_URL`
   - Copy the "Direct Connection" for `DIRECT_URL`

#### Environment Variables in Vercel
1. **Go to Project Settings**:
   - Navigate to your project in Vercel dashboard
   - Click "Settings" → "Environment Variables"

2. **Add Required Variables**:
   ```
   DATABASE_URL = postgresql://username:password@host:port/database
   DIRECT_URL = postgresql://username:password@host:port/database
   NEXTAUTH_SECRET = your-generated-secret-here
   NEXTAUTH_URL = https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
   NODE_ENV = production
   ```

3. **Set Environment Scope**:
   - Select "Production" for all variables
   - Optionally add "Preview" if you want staging environments

#### Generate Production NEXTAUTH_SECRET
```bash
# Generate a secure secret for production
openssl rand -base64 32
```

## Environment-Specific Values

### Local Development
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Production
```env
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NODE_ENV="production"
```

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different NEXTAUTH_SECRET** for each environment
3. **Keep production secrets secure** - only add them in Vercel dashboard
4. **Regularly rotate secrets** in production
5. **Use environment-specific URLs** to prevent cross-environment issues

## Troubleshooting

### Common Issues

#### "Invalid NEXTAUTH_SECRET"
- Ensure the secret is at least 32 characters
- Verify no extra spaces or quotes in the value
- Regenerate with `openssl rand -base64 32`

#### "Database connection failed"
- Check DATABASE_URL format
- Verify database credentials
- Ensure database is accessible from your deployment

#### "NEXTAUTH_URL mismatch"
- Ensure NEXTAUTH_URL matches your actual domain
- Check for trailing slashes
- Verify HTTPS in production

### Verification Commands

```bash
# Test database connection
npm run db:test

# Verify environment variables
npm run env:check

# Test authentication setup
npm run auth:test
```

## Next Steps

Once your Basic tier is running, you can add Pro tier features by configuring:
- Stripe payment integration
- OpenAI API for AI features
- File storage with Vercel Blob
- Rate limiting with Upstash Redis

See the [Pro Tier Setup Guide](PRO_TIER_SETUP.md) for advanced features.

## Support

If you encounter issues:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review Vercel deployment logs
3. Verify all environment variables are set correctly
4. Contact support with specific error messages
