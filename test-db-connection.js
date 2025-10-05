#!/usr/bin/env node

/**
 * Database Connection Test for iLegal
 * Tests the connection to your Supabase PostgreSQL database
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing iLegal Database Connection...');
  console.log('=====================================\n');
  
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('📡 Connecting to database...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('🧪 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Basic query successful:', result[0]);
    
    // Test if we can access the database schema
    console.log('🔍 Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Test Prisma client generation
    console.log('🔧 Testing Prisma client...');
    try {
      // This will fail if tables don't exist, but that's expected for first run
      const userCount = await prisma.user.count();
      console.log('✅ User table accessible, count:', userCount);
    } catch (error) {
      console.log('ℹ️  User table not found (expected for first deployment)');
      console.log('   This is normal - tables will be created during migration');
    }
    
    await prisma.$disconnect();
    console.log('✅ Database connection closed successfully!');
    
    console.log('\n🎉 Database connection test PASSED!');
    console.log('📋 Your database is ready for deployment');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test FAILED:');
    console.error('Error:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Make sure DATABASE_URL is set in your environment variables');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Check if your Supabase database is running and accessible');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Verify your database credentials are correct');
    }
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check environment variables: vercel env ls');
    console.log('2. Verify Supabase database is running');
    console.log('3. Check database connection string format');
    
    return false;
  }
}

async function main() {
  console.log('🚀 iLegal Database Connection Test');
  console.log('==================================\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable is not set');
    console.log('\n📋 To fix this:');
    console.log('1. Run: vercel env pull .env.local');
    console.log('2. Or set DATABASE_URL manually');
    console.log('3. Run this test again');
    return;
  }
  
  console.log('📍 DATABASE_URL is set');
  console.log('🔗 Connection string:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
  console.log('');
  
  const success = await testDatabaseConnection();
  
  if (success) {
    console.log('\n✅ Database is ready for deployment!');
    console.log('🚀 You can now deploy your application');
  } else {
    console.log('\n❌ Database setup needs attention');
    console.log('🔧 Fix the issues above before deploying');
  }
}

main().catch(console.error);

