const { PrismaClient } = require('@prisma/client')

async function diagnoseDatabaseConnection() {
  console.log('🔍 Diagnosing database connection issues...\n')

  // Check environment variables
  console.log('1. Checking environment variables:')
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL is not set')
    return
  }
  
  if (!directUrl) {
    console.log('❌ DIRECT_URL is not set')
    return
  }

  console.log('✅ DATABASE_URL is set')
  console.log('✅ DIRECT_URL is set')

  // Parse connection strings
  try {
    const dbUrl = new URL(databaseUrl)
    const directUrlParsed = new URL(directUrl)
    
    console.log('\n2. Connection string analysis:')
    console.log(`DATABASE_URL host: ${dbUrl.hostname}`)
    console.log(`DATABASE_URL port: ${dbUrl.port}`)
    console.log(`DIRECT_URL host: ${directUrlParsed.hostname}`)
    console.log(`DIRECT_URL port: ${directUrlParsed.port}`)

    // Check if it's Supabase
    if (dbUrl.hostname.includes('supabase.com')) {
      console.log('\n3. Supabase connection detected:')
      
      if (dbUrl.port === '5432') {
        console.log('❌ DATABASE_URL is using port 5432 (should be 6543 for pooled connection)')
        console.log('🔧 Fix: Change DATABASE_URL to use port 6543')
        console.log('   Example: postgresql://postgres:[password]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1')
      } else if (dbUrl.port === '6543') {
        console.log('✅ DATABASE_URL is using correct port 6543')
      }

      if (directUrlParsed.port === '6543') {
        console.log('❌ DIRECT_URL is using port 6543 (should be 5432 for direct connection)')
        console.log('🔧 Fix: Change DIRECT_URL to use port 5432')
        console.log('   Example: postgresql://postgres:[password]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres')
      } else if (directUrlParsed.port === '5432') {
        console.log('✅ DIRECT_URL is using correct port 5432')
      }
    }

    // Test connection
    console.log('\n4. Testing database connection:')
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })

    try {
      await prisma.$connect()
      console.log('✅ Database connection successful!')
      
      // Test a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Database query successful!')
      
    } catch (error) {
      console.log('❌ Database connection failed:')
      console.log(`   Error: ${error.message}`)
      
      if (error.code === 'P1001') {
        console.log('\n🔧 P1001 Error Solutions:')
        console.log('   1. Check if the database server is running')
        console.log('   2. Verify the connection string is correct')
        console.log('   3. For Supabase: Use port 6543 for DATABASE_URL and port 5432 for DIRECT_URL')
        console.log('   4. Check if the database allows connections from your IP')
        console.log('   5. Verify the password is correct')
      }
    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.log('❌ Error parsing connection strings:', error.message)
  }
}

// Run the diagnosis
diagnoseDatabaseConnection()
  .then(() => {
    console.log('\n🎯 Next steps:')
    console.log('1. Update your environment variables in Vercel dashboard')
    console.log('2. For Supabase:')
    console.log('   - DATABASE_URL: Use port 6543 with ?pgbouncer=true&connection_limit=1')
    console.log('   - DIRECT_URL: Use port 5432')
    console.log('3. Redeploy your application')
    console.log('4. Test the connection again')
  })
  .catch(console.error)
