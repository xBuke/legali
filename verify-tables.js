#!/usr/bin/env node

/**
 * Verify Database Tables for iLegal
 * This script verifies that all tables were created correctly
 */

const { Client } = require('pg');

async function verifyTables() {
  console.log('🔍 Verifying Database Tables for iLegal');
  console.log('========================================\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check all tables
    const tables = ['organizations', 'users', 'sessions', 'clients', 'cases'];
    
    for (const tableName of tables) {
      console.log(`\n📋 Checking table: ${tableName}`);
      
      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (tableExists.rows[0].exists) {
        console.log(`   ✅ Table ${tableName} exists`);
        
        // Get column information
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`   📊 Columns (${columns.rows.length}):`);
        columns.rows.forEach(col => {
          console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
        
        // Check row count
        const count = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(`   📈 Row count: ${count.rows[0].count}`);
        
      } else {
        console.log(`   ❌ Table ${tableName} does not exist`);
      }
    }
    
    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const indexes = await client.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`📊 Found ${indexes.rows.length} indexes:`);
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname} on ${idx.tablename}`);
    });
    
    await client.end();
    console.log('\n🎉 Database verification completed!');
    console.log('📋 All tables are ready for your application');
    
  } catch (error) {
    console.error('❌ Verification failed:');
    console.error(error.message);
    await client.end();
    process.exit(1);
  }
}

verifyTables();

