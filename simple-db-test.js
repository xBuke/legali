#!/usr/bin/env node

/**
 * Simple Database Connection Test
 * Tests PostgreSQL connection without Prisma
 */

const { Client } = require('pg');

async function testPostgreSQLConnection() {
  console.log('🔍 Testing PostgreSQL Connection...');
  console.log('==================================\n');
  
  const connectionString = "postgresql://postgres.lqupkbfbfssialgybuan:RIXBmKSLFycLj7Us@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require";
  
  console.log('📍 Connection string:', connectionString.replace(/\/\/.*@/, '//***:***@'));
  console.log('');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: true
  });
  
  try {
    console.log('📡 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    console.log('🧪 Testing basic query...');
    const result = await client.query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    console.log('🔍 Checking database version...');
    const version = await client.query('SELECT version()');
    console.log('📋 Database version:', version.rows[0].version.split(' ')[0]);
    
    console.log('🔍 Checking available schemas...');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);
    console.log('📋 Available schemas:', schemas.rows.map(r => r.schema_name));
    
    console.log('🔍 Checking tables in public schema...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables in public schema:', tables.rows.map(t => t.table_name));
    
    await client.end();
    console.log('✅ Connection closed successfully!');
    
    console.log('\n🎉 PostgreSQL Database Test PASSED!');
    console.log('📋 Your Supabase database is working perfectly');
    console.log('🚀 Ready for deployment!');
    
    return true;
    
  } catch (error) {
    console.error('❌ PostgreSQL connection test FAILED:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS resolution failed - check your internet connection');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication failed - check your database credentials');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused - check if database is running');
    }
    
    return false;
  }
}

testPostgreSQLConnection().catch(console.error);
