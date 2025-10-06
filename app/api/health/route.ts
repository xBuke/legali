import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEnvironmentStatus, validateRequiredEnvironment } from '@/lib/env-validation';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Checks:
 * - Database connectivity
 * - Environment variables
 * - Application status
 */
export async function GET() {
  const startTime = Date.now();
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    responseTime: 0,
    checks: {
      database: { status: 'unknown', message: '', responseTime: 0 },
      environment: { status: 'unknown', message: '', details: {} },
      application: { status: 'healthy', message: 'Application is running' }
    }
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    try {
      await db.$queryRaw`SELECT 1 as health_check`;
      healthCheck.checks.database = {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime: Date.now() - dbStartTime
      };
    } catch (dbError) {
      healthCheck.checks.database = {
        status: 'unhealthy',
        message: `Database connection failed: ${dbError.message}`,
        responseTime: Date.now() - dbStartTime
      };
      healthCheck.status = 'unhealthy';
    }

    // Check environment variables
    try {
      const envConfig = validateRequiredEnvironment();
      healthCheck.checks.environment = {
        status: 'healthy',
        message: 'All required environment variables are present',
        details: {
          nodeEnv: envConfig.NODE_ENV,
          hasDatabaseUrl: !!envConfig.DATABASE_URL,
          hasNextAuthSecret: !!envConfig.NEXTAUTH_SECRET,
          hasNextAuthUrl: !!envConfig.NEXTAUTH_URL,
          hasAppUrl: !!envConfig.NEXT_PUBLIC_APP_URL,
          nextAuthUrl: envConfig.NEXTAUTH_URL,
          appUrl: envConfig.NEXT_PUBLIC_APP_URL
        }
      };
    } catch (envError) {
      healthCheck.checks.environment = {
        status: 'unhealthy',
        message: `Environment validation failed: ${envError.message}`,
        details: getEnvironmentStatus()
      };
      healthCheck.status = 'unhealthy';
    }

    // Calculate total response time
    healthCheck.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.responseTime = Date.now() - startTime;
    healthCheck.checks.application = {
      status: 'unhealthy',
      message: `Health check failed: ${error.message}`
    };

    return NextResponse.json(healthCheck, { status: 500 });
  }
}

/**
 * Detailed Health Check Endpoint
 * GET /api/health/detailed
 * 
 * Provides more detailed information for debugging
 */
export async function POST() {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: getEnvironmentStatus(),
      database: {
        connected: false,
        error: null as string | null
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };

    // Test database with more detailed info
    try {
      const dbStartTime = Date.now();
      const result = await db.$queryRaw`SELECT 1 as health_check, NOW() as current_time`;
      detailedHealth.database = {
        connected: true,
        error: null
      };
    } catch (dbError) {
      detailedHealth.database = {
        connected: false,
        error: dbError.message
      };
      detailedHealth.status = 'unhealthy';
    }

    return NextResponse.json(detailedHealth, { 
      status: detailedHealth.status === 'healthy' ? 200 : 503 
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 500 }
    );
  }
}
