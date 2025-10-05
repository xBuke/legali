const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Create organization first
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Law Firm',
        email: 'test@lawfirm.hr',
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        storageLimit: 1000000000, // 1GB for testing
      },
    })

    console.log('✅ Organization created:', organization.name)

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test@lawfirm.hr',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: organization.id,
      },
    })

    console.log('✅ Test user created:')
    console.log('   Email: test@lawfirm.hr')
    console.log('   Password: password123')
    console.log('   Role: ADMIN')
    console.log('   Organization:', organization.name)

    // Create a test client
    const client = await prisma.client.create({
      data: {
        clientType: 'INDIVIDUAL',
        firstName: 'Ivan',
        lastName: 'Horvat',
        email: 'ivan.horvat@example.com',
        phone: '+385 91 123 4567',
        address: 'Ilica 123',
        city: 'Zagreb',
        postalCode: '10000',
        country: 'Croatia',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
    })

    console.log('✅ Test client created:', `${client.firstName} ${client.lastName}`)

    // Create a test case
    const caseData = await prisma.case.create({
      data: {
        caseNumber: 'CASE-000001',
        title: 'Radni spor - Ivan Horvat',
        description: 'Test case for demonstration purposes',
        caseType: 'Radno pravo',
        status: 'OPEN',
        priority: 'MEDIUM',
        clientId: client.id,
        organizationId: organization.id,
      },
    })

    console.log('✅ Test case created:', caseData.title)

    console.log('\n🎉 Test data created successfully!')
    console.log('\n📋 Test Credentials:')
    console.log('   Email: test@lawfirm.hr')
    console.log('   Password: password123')
    console.log('\n🌐 Login at: http://localhost:3001/sign-in')

  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
