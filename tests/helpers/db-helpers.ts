import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Test database instance
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
})

// Test data factories
export const createTestUser = async (overrides: any = {}) => {
  const hashedPassword = await bcrypt.hash('testpassword123', 10)
  
  return testDb.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      organizationId: overrides.organizationId || 'test-org-id',
      ...overrides
    }
  })
}

export const createTestOrganization = async (overrides: any = {}) => {
  return testDb.organization.create({
    data: {
      name: `Test Org ${Date.now()}`,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      storageLimit: BigInt(53687091200), // 50GB
      ...overrides
    }
  })
}

export const createTestClient = async (organizationId: string, overrides: any = {}) => {
  return testDb.client.create({
    data: {
      firstName: 'Test',
      lastName: 'Client',
      email: `client-${Date.now()}@example.com`,
      clientType: 'INDIVIDUAL',
      organizationId,
      ...overrides
    }
  })
}

export const createTestCase = async (organizationId: string, clientId: string, overrides: any = {}) => {
  return testDb.case.create({
    data: {
      caseNumber: `TEST-${Date.now()}`,
      title: 'Test Case',
      status: 'OPEN',
      priority: 'MEDIUM',
      caseType: 'CIVIL',
      clientId,
      organizationId,
      ...overrides
    }
  })
}

export const createTestDocument = async (organizationId: string, overrides: any = {}) => {
  return testDb.document.create({
    data: {
      fileName: 'test-document.pdf',
      originalName: 'test-document.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      fileUrl: '/test/path/document.pdf',
      title: 'Test Document',
      category: 'CONTRACT',
      organizationId,
      ...overrides
    }
  })
}

// Database cleanup utilities
export const cleanupTestData = async () => {
  // Delete in reverse order of dependencies
  await testDb.document.deleteMany({})
  await testDb.case.deleteMany({})
  await testDb.client.deleteMany({})
  await testDb.user.deleteMany({})
  await testDb.organization.deleteMany({})
}

export const setupTestDatabase = async () => {
  // Ensure database is clean before tests
  await cleanupTestData()
}

export const teardownTestDatabase = async () => {
  // Clean up after tests
  await cleanupTestData()
  await testDb.$disconnect()
}

// Helper to create a complete test setup (org + user + client)
export const createTestSetup = async () => {
  const organization = await createTestOrganization()
  const user = await createTestUser({ organizationId: organization.id })
  const client = await createTestClient(organization.id)
  
  return { organization, user, client }
}
