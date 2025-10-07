import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Creating test user and organization...')

    // Check if organization already exists, if not create it
    let organization = await prisma.organization.findFirst({
      where: {
        name: 'Test Law Firm'
      }
    })

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Law Firm',
          email: 'admin@testlawfirm.hr',
          subscriptionTier: 'BASIC',
          subscriptionStatus: 'ACTIVE',
          storageLimit: BigInt(53687091200), // 50GB in bytes
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        }
      })
    } else {
      // Update existing organization
      organization = await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscriptionTier: 'BASIC',
          subscriptionStatus: 'ACTIVE',
          updatedAt: new Date()
        }
      })
    }

    console.log('✅ Organization created/updated:', organization.name)

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create/upsert User
    const user = await prisma.user.upsert({
      where: {
        email: 'test@lawfirm.hr'
      },
      update: {
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        organizationId: organization.id,
        updatedAt: new Date()
      },
      create: {
        email: 'test@lawfirm.hr',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        organizationId: organization.id,
        hourlyRate: 150.00,
        currency: 'EUR'
      }
    })

    console.log('✅ User created/updated:', user.email)

    // Log success message with credentials
    console.log('\n🎉 Test account setup completed successfully!')
    console.log('\n📋 Test Credentials:')
    console.log('   Email: test@lawfirm.hr')
    console.log('   Password: password123')
    console.log('   Role: ADMIN')
    console.log('   Organization: Test Law Firm')
    console.log('   Subscription: BASIC (ACTIVE)')
    console.log('\n🌐 Login at: http://localhost:3000/sign-in')
    console.log('\n💡 You can now use these credentials to test the application.')

  } catch (error) {
    console.error('❌ Error creating test user:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code)
    }
    
    process.exit(1)
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect()
    console.log('\n🔌 Database connection closed.')
  }
}

// Run the main function
main()
  .catch((error) => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })
