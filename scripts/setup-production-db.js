const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function setupProductionDatabase() {
  console.log('🚀 Setting up production database...\n')

  try {
    // 1. Test connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // 2. Check if tables exist
    console.log('2. Checking database schema...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    console.log(`✅ Found ${tables.length} tables in database`)
    tables.forEach(table => console.log(`   - ${table.table_name}`))
    console.log('')

    // 3. Check if required tables exist
    const requiredTables = ['organizations', 'users', 'clients', 'cases']
    const existingTables = tables.map(t => t.table_name)
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:', missingTables.join(', '))
      console.log('🔧 Running database migrations...')
      
      // Run prisma db push to create missing tables
      const { execSync } = require('child_process')
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
        console.log('✅ Database migrations completed\n')
      } catch (error) {
        console.error('❌ Migration failed:', error.message)
        throw error
      }
    } else {
      console.log('✅ All required tables exist\n')
    }

    // 4. Check if there are any users
    console.log('3. Checking existing users...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database\n`)

    // 5. Check organizations
    console.log('4. Checking organizations...')
    const orgCount = await prisma.organization.count()
    console.log(`✅ Found ${orgCount} organizations in database\n`)

    // 6. Test creating a test user (if none exist)
    if (userCount === 0) {
      console.log('5. Creating test user...')
      
      // Create test organization
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Test Law Firm',
          subscriptionTier: 'BASIC',
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          storageLimit: BigInt(53687091200), // 50GB
        },
      })
      console.log(`✅ Created test organization: ${testOrg.name}`)

      // Create test user
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test@lawfirm.hr',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN',
          organizationId: testOrg.id,
          isActive: true,
        },
      })
      console.log(`✅ Created test user: ${testUser.email}`)
      console.log('   Password: password123')
      console.log('')

      // Create test client
      const testClient = await prisma.client.create({
        data: {
          clientType: 'INDIVIDUAL',
          firstName: 'Ivan',
          lastName: 'Horvat',
          email: 'ivan.horvat@example.com',
          phone: '+385 91 123 4567',
          address: 'Ilica 123, Zagreb',
          status: 'ACTIVE',
          organizationId: testOrg.id,
        },
      })
      console.log(`✅ Created test client: ${testClient.firstName} ${testClient.lastName}`)

      // Create test case
      const testCase = await prisma.case.create({
        data: {
          caseNumber: 'CASE-000001',
          title: 'Radni spor - Ivan Horvat',
          description: 'Test case for labor law dispute',
          caseType: 'Radno pravo',
          status: 'OPEN',
          priority: 'MEDIUM',
          clientId: testClient.id,
          organizationId: testOrg.id,
        },
      })
      console.log(`✅ Created test case: ${testCase.title}`)
      console.log('')
    }

    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('📋 Test Credentials:')
    console.log('   Email: test@lawfirm.hr')
    console.log('   Password: password123')
    console.log('')
    console.log('🌐 You can now test the application at:')
    console.log('   https://ilegalclaude.vercel.app/sign-in')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    
    if (error.code === 'P1001') {
      console.error('   Database connection failed. Check your DATABASE_URL.')
    } else if (error.code === 'P1000') {
      console.error('   Authentication failed. Check your database credentials.')
    } else if (error.code === 'P1017') {
      console.error('   Database server closed the connection.')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
setupProductionDatabase()
