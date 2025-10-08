import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test basic database connection
    await db.$connect()
    
    // Test a simple query
    const result = await db.$queryRaw`SELECT 1 as test`
    
    // Test if tables exist
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'clients', 'cases')
      ORDER BY table_name;
    `
    
    // Test if we can query the users table
    const userCount = await db.user.count()
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      details: {
        connection: 'OK',
        testQuery: result,
        tablesFound: tables,
        userCount,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connection: 'FAILED',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  } finally {
    await db.$disconnect()
  }
}
