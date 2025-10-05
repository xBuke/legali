#!/usr/bin/env node

/**
 * Database Migration Script for iLegal
 * This script will run the database migrations in the Vercel environment
 */

const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🚀 Running Database Migrations for iLegal');
  console.log('==========================================\n');
  
  try {
    console.log('📋 Step 1: Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully!\n');
    
    console.log('📋 Step 2: Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema pushed successfully!\n');
    
    console.log('📋 Step 3: Verifying tables...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully!\n');
    
    console.log('🎉 All migrations completed successfully!');
    console.log('📋 Your database is ready for deployment');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if DATABASE_URL is set correctly');
    console.log('2. Verify database connection');
    console.log('3. Check Prisma schema configuration');
    
    process.exit(1);
  }
}

runMigrations();

