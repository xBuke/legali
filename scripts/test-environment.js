#!/usr/bin/env node

/**
 * Environment Test Script
 * Tests environment configuration and database connectivity
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 iLegal Environment Test Script');
console.log('==================================\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Test environment variables
console.log('1. Testing Environment Variables:');
console.log('==================================');

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV'
];

let envIssues = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    
    // Additional validation
    if (varName === 'NEXTAUTH_SECRET' && value.length < 32) {
      console.log(`   ⚠️  ${varName}: Secret should be at least 32 characters`);
      envIssues++;
    }
    
    if ((varName === 'NEXTAUTH_URL' || varName === 'NEXT_PUBLIC_APP_URL') && value.endsWith('/')) {
      console.log(`   ⚠️  ${varName}: URL should not end with trailing slash`);
      envIssues++;
    }
  } else {
    console.log(`   ❌ ${varName}: Missing`);
    envIssues++;
  }
});

console.log('');

// Test database connection
console.log('2. Testing Database Connection:');
console.log('===============================');

async function testDatabase() {
  try {
    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const responseTime = Date.now() - startTime;
    
    console.log(`   ✅ Database connection successful (${responseTime}ms)`);
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`   ✅ Database query successful (${userCount} users found)`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    return false;
  }
}

// Test NextAuth configuration
console.log('\n3. Testing NextAuth Configuration:');
console.log('===================================');

try {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (nextAuthUrl && appUrl) {
    if (nextAuthUrl === appUrl || 
        (nextAuthUrl.includes('localhost') && appUrl.includes('localhost'))) {
      console.log('   ✅ NextAuth URLs are consistent');
    } else {
      console.log('   ⚠️  NextAuth URLs may be inconsistent');
      console.log(`      NEXTAUTH_URL: ${nextAuthUrl}`);
      console.log(`      APP_URL: ${appUrl}`);
    }
  }
  
  // Check if URLs are valid
  try {
    new URL(nextAuthUrl);
    new URL(appUrl);
    console.log('   ✅ URLs are valid');
  } catch (urlError) {
    console.log('   ❌ Invalid URL format');
    envIssues++;
  }
} catch (error) {
  console.log('   ❌ NextAuth configuration error');
  envIssues++;
}

// Summary
console.log('\n📊 Test Summary:');
console.log('================');

if (envIssues === 0) {
  console.log('✅ All environment tests passed!');
  console.log('   Your environment is properly configured.');
} else {
  console.log(`❌ Found ${envIssues} environment issue(s)`);
  console.log('   Please fix the issues above before proceeding.');
}

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Fix any environment issues shown above');
console.log('2. Run: npm run dev');
console.log('3. Test: http://localhost:3000/api/health');
console.log('4. Test authentication flow');

// Run database test
testDatabase().then(dbSuccess => {
  if (dbSuccess && envIssues === 0) {
    console.log('\n🎉 Environment is ready for development!');
  } else {
    console.log('\n⚠️  Please fix the issues above before starting development.');
  }
}).catch(error => {
  console.log('\n❌ Database test failed:', error.message);
});
