#!/usr/bin/env node

/**
 * Database Setup Script for iLegal
 * This script helps you set up the database connection and test it
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful!');
    
    await prisma.$disconnect();
    console.log('✅ Database connection closed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Make sure to set DATABASE_URL in your environment variables');
      console.log('   Example: DATABASE_URL="postgresql://username:password@host:port/database"');
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 iLegal Database Setup');
  console.log('========================\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable is not set');
    console.log('\n📋 To set up your database:');
    console.log('1. Create a PostgreSQL database (Vercel Postgres, Supabase, etc.)');
    console.log('2. Set DATABASE_URL in your environment variables');
    console.log('3. Run this script again to test the connection');
    console.log('\n📖 See setup-vercel-postgres.md for detailed instructions');
    return;
  }
  
  console.log('📍 DATABASE_URL is set');
  console.log('🔗 Connection string:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
  
  const success = await testDatabaseConnection();
  
  if (success) {
    console.log('\n🎉 Database setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Run database migrations: npx prisma migrate deploy');
    console.log('2. Deploy your application to Vercel');
    console.log('3. Test user registration and login');
  } else {
    console.log('\n❌ Database setup failed');
    console.log('📖 Check setup-vercel-postgres.md for troubleshooting');
  }
}

main().catch(console.error);

