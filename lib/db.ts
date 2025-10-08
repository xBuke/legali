import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with proper configuration for serverless
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling and timeout configuration for production
    ...(process.env.NODE_ENV === 'production' && {
      // Connection pool settings for Vercel
      __internal: {
        engine: {
          connectTimeout: 60000, // 60 seconds
          queryTimeout: 30000,   // 30 seconds
        },
      },
    }),
  })

  // Add connection error handling
  client.$on('error', (e) => {
    console.error('Prisma error:', e)
  })

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Export for backward compatibility
export const prisma = db
export default db
