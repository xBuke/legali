#!/usr/bin/env node

/**
 * Environment Fix Script
 * This script helps fix environment configuration issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 iLegal Environment Fix Script');
console.log('================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

console.log('📋 Environment Fix Checklist:');
console.log('');

// 1. Check for existing .env files
console.log('1. Checking existing environment files...');
const envFiles = ['.env', '.env.local', '.env.production'];
const existingFiles = envFiles.filter(file => fs.existsSync(file));

if (existingFiles.length > 0) {
  console.log(`   ✅ Found existing files: ${existingFiles.join(', ')}`);
} else {
  console.log('   ⚠️  No .env files found');
}

// 2. Check for fixed environment files
console.log('\n2. Checking for fixed environment files...');
const fixedFiles = ['env.local.fixed', 'env.production.fixed'];
const availableFixes = fixedFiles.filter(file => fs.existsSync(file));

if (availableFixes.length > 0) {
  console.log(`   ✅ Found fixed files: ${availableFixes.join(', ')}`);
} else {
  console.log('   ❌ No fixed environment files found');
}

// 3. Check for new validation files
console.log('\n3. Checking for new validation files...');
const newFiles = ['lib/env-validation.ts', 'app/api/health/route.ts'];
const createdFiles = newFiles.filter(file => fs.existsSync(file));

if (createdFiles.length > 0) {
  console.log(`   ✅ Created files: ${createdFiles.join(', ')}`);
} else {
  console.log('   ❌ New validation files not found');
}

console.log('\n📝 Manual Steps Required:');
console.log('==========================');
console.log('');

console.log('1. 🔄 Update your environment files:');
console.log('   - Copy env.local.fixed to .env.local (for local development)');
console.log('   - Copy env.production.fixed to .env (for production)');
console.log('   - Update Vercel environment variables with production values');
console.log('');

console.log('2. 🔑 Update Stripe keys (if using payments):');
console.log('   - Replace test keys with live keys in production');
console.log('   - Update Stripe price IDs in Stripe Dashboard');
console.log('');

console.log('3. 🧪 Test the fixes:');
console.log('   - Run: npm run dev');
console.log('   - Visit: http://localhost:3000/api/health');
console.log('   - Check authentication flow');
console.log('');

console.log('4. 🚀 Deploy to production:');
console.log('   - Update Vercel environment variables');
console.log('   - Redeploy your application');
console.log('   - Test: https://ilegalclaude.vercel.app/api/health');
console.log('');

console.log('🔍 Key Changes Made:');
console.log('====================');
console.log('✅ Fixed NEXTAUTH_URL domain (removed trailing slash)');
console.log('✅ Added NODE_ENV variable');
console.log('✅ Added environment validation system');
console.log('✅ Created health check endpoint');
console.log('✅ Enhanced error handling in auth routes');
console.log('');

console.log('📞 If you need help:');
console.log('====================');
console.log('1. Check the health endpoint: /api/health');
console.log('2. Review environment validation errors in console');
console.log('3. Verify database connectivity');
console.log('4. Test authentication flow step by step');
console.log('');

console.log('✨ Environment fix script completed!');
console.log('   Follow the manual steps above to complete the fix.');
