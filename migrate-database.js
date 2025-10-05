#!/usr/bin/env node

/**
 * Database Migration Script for iLegal
 * This script creates all necessary tables in the PostgreSQL database
 */

const { Client } = require('pg');

async function createTables() {
  console.log('🚀 Creating Database Tables for iLegal');
  console.log('======================================\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('📍 Connecting to database...');
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Create all tables based on the Prisma schema
    const createTablesSQL = `
      -- Create Organizations table
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT,
        "address" TEXT,
        "taxId" TEXT,
        "logo" TEXT,
        "subscriptionTier" TEXT NOT NULL DEFAULT 'BASIC',
        "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
        "stripeCustomerId" TEXT UNIQUE,
        "stripeSubscriptionId" TEXT UNIQUE,
        "trialEndsAt" TIMESTAMP(3),
        "subscriptionEndsAt" TIMESTAMP(3),
        "storageUsed" BIGINT NOT NULL DEFAULT 0,
        "storageLimit" BIGINT NOT NULL DEFAULT 53687091200,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );

      -- Create Users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "avatar" TEXT,
        "role" TEXT NOT NULL DEFAULT 'LAWYER',
        "hourlyRate" DOUBLE PRECISION,
        "currency" TEXT NOT NULL DEFAULT 'EUR',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP(3),
        "emailVerified" TIMESTAMP(3),
        "twoFactorSecret" TEXT,
        "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        "backupCodes" TEXT,
        "twoFactorVerifiedAt" TIMESTAMP(3),
        "notificationSettings" TEXT,
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Create Sessions table
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Create Clients table
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clientType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
        "firstName" TEXT,
        "lastName" TEXT,
        "dateOfBirth" TIMESTAMP(3),
        "personalId" TEXT,
        "companyName" TEXT,
        "registrationNumber" TEXT,
        "taxId" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "mobile" TEXT,
        "address" TEXT,
        "city" TEXT,
        "postalCode" TEXT,
        "country" TEXT NOT NULL DEFAULT 'Croatia',
        "notes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "portalAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
        "portalInviteSentAt" TIMESTAMP(3),
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Create Cases table
      CREATE TABLE IF NOT EXISTS "cases" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "caseNumber" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "caseType" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "courtName" TEXT,
        "courtCaseNumber" TEXT,
        "judge" TEXT,
        "opposingCounsel" TEXT,
        "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "closedAt" TIMESTAMP(3),
        "nextHearingDate" TIMESTAMP(3),
        "statuteOfLimitations" TIMESTAMP(3),
        "estimatedValue" DOUBLE PRECISION,
        "contingencyFee" DOUBLE PRECISION,
        "clientId" TEXT NOT NULL,
        "assignedToId" TEXT,
        "organizationId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS "organizations_stripeCustomerId_idx" ON "organizations"("stripeCustomerId");
      CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");
      CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
      CREATE INDEX IF NOT EXISTS "clients_organizationId_idx" ON "clients"("organizationId");
      CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients"("email");
      CREATE INDEX IF NOT EXISTS "cases_organizationId_idx" ON "cases"("organizationId");
      CREATE INDEX IF NOT EXISTS "cases_clientId_idx" ON "cases"("clientId");
      CREATE INDEX IF NOT EXISTS "cases_status_idx" ON "cases"("status");
      CREATE UNIQUE INDEX IF NOT EXISTS "cases_organizationId_caseNumber_key" ON "cases"("organizationId", "caseNumber");
    `;
    
    console.log('🔧 Creating tables...');
    await client.query(createTablesSQL);
    console.log('✅ All tables created successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await client.end();
    console.log('\n🎉 Database migration completed successfully!');
    console.log('📋 Your iLegal database is ready for deployment');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

createTables();

