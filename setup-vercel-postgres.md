# 🗄️ Vercel Postgres Setup Guide

Since the Vercel CLI is having issues, let's set up the database through the Vercel dashboard.

## 📋 **Step-by-Step Setup**

### **1. Access Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sign in with your account (`mskoric1996-4802`)
3. Find your `ilegalclaude` project

### **2. Create Postgres Database**
1. In your project dashboard, go to the **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Name it: `ilegal-production-db`
5. Choose a region close to you (e.g., `iad1` for US East)
6. Click **"Create"**

### **3. Get Connection Strings**
After creating the database:
1. Click on your new database
2. Go to the **"Settings"** tab
3. Copy the following values:
   - **Connection String** (for `DATABASE_URL`)
   - **Direct Connection String** (for `DIRECT_URL`)

### **4. Set Environment Variables**
1. In your project dashboard, go to **"Settings"** → **"Environment Variables"**
2. Add the following variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=https://ilegalclaude.vercel.app
NEXT_PUBLIC_APP_URL=https://ilegalclaude.vercel.app
```

### **5. Generate NEXTAUTH_SECRET**
You need to generate a secure secret key. You can use this command:

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **6. Deploy**
After setting all environment variables:
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 🔧 **Alternative: Manual Database Creation**

If you prefer to create the database manually, you can also:

1. **Use Supabase** (free tier available):
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get the connection string from Settings → Database

2. **Use Railway** (free tier available):
   - Go to [railway.app](https://railway.app)
   - Create a new PostgreSQL database
   - Get the connection string

3. **Use Neon** (free tier available):
   - Go to [neon.tech](https://neon.tech)
   - Create a new database
   - Get the connection string

## 📝 **Environment Variables Template**

Here's what you need to set in Vercel:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# Authentication (Required)
NEXTAUTH_SECRET="your-generated-secret-key-here"
NEXTAUTH_URL="https://ilegalclaude.vercel.app"
NEXT_PUBLIC_APP_URL="https://ilegalclaude.vercel.app"

# Stripe (Optional - for billing features)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# File Storage (Optional)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# AI Features (Optional)
OPENAI_API_KEY="sk-..."
```

## 🚀 **After Setup**

Once you've set up the database and environment variables:

1. **Test the deployment** by visiting your Vercel URL
2. **Check the logs** in Vercel dashboard for any errors
3. **Test user registration** to verify database connection
4. **Monitor performance** and fix any issues

## 🆘 **Troubleshooting**

### **Common Issues:**
- **Database connection errors**: Check if `DATABASE_URL` is set correctly
- **Authentication errors**: Verify `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` matches your domain
- **Build failures**: Check if all required environment variables are set

### **Getting Help:**
- Check Vercel function logs in the dashboard
- Verify environment variables are set correctly
- Ensure database is accessible and running

