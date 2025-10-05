import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, getSecurityHeaders, logSecurityEvent, validateRequestBody, validationSchemas } from './security';

/**
 * Security Middleware
 * Applies rate limiting, input validation, and security headers
 */

export interface SecurityConfig {
  rateLimit?: 'auth' | 'api' | 'upload' | 'search';
  validateInput?: keyof typeof validationSchemas;
  requireAuth?: boolean;
  logSecurityEvents?: boolean;
}

/**
 * Apply security middleware to API routes
 */
export async function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply rate limiting
      if (config.rateLimit) {
        const rateLimitResult = await applyRateLimit(request, config.rateLimit);
        
        if (!rateLimitResult.success) {
          const response = NextResponse.json(
            { error: 'Previše zahtjeva. Molimo pokušajte ponovno kasnije.' },
            { status: 429 }
          );
          
          response.headers.set('Retry-After', rateLimitResult.reset.toString());
          response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
          response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
          response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
          
          if (config.logSecurityEvents) {
            await logSecurityEvent('RATE_LIMIT_EXCEEDED', {
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              reset: rateLimitResult.reset
            }, request);
          }
          
          return response;
        }
      }
      
      // Validate input if schema is provided
      if (config.validateInput) {
        const body = await request.json().catch(() => null);
        if (body) {
          const validationResult = validateRequestBody(body, validationSchemas[config.validateInput] as any);
          
          if (!validationResult.success) {
            if (config.logSecurityEvents) {
              await logSecurityEvent('INPUT_VALIDATION_FAILED', {
                errors: validationResult.errors,
                body: JSON.stringify(body).substring(0, 1000) // Limit log size
              }, request);
            }
            
            return NextResponse.json(
              { error: 'Neispravni podaci', details: validationResult.errors },
              { status: 400 }
            );
          }
        }
      }
      
      // Call the original handler
      const response = await handler(request);
      
      // Add security headers to response
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      if (config.logSecurityEvents) {
        await logSecurityEvent('SECURITY_MIDDLEWARE_ERROR', {
          error: error instanceof Error ? error.message : 'Unknown error'
        }, request);
      }
      
      return NextResponse.json(
        { error: 'Greška u sigurnosnom sustavu' },
        { status: 500 }
      );
    }
  };
}

/**
 * Rate limiting wrapper for specific endpoints
 */
export function withRateLimit(limitType: 'auth' | 'api' | 'upload' | 'search' = 'api') {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return withSecurity(handler, { rateLimit: limitType, logSecurityEvents: true });
  };
}

/**
 * Input validation wrapper
 */
export function withValidation(schema: keyof typeof validationSchemas) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return withSecurity(handler, { validateInput: schema, logSecurityEvents: true });
  };
}

/**
 * Authentication wrapper
 */
export function withAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, { requireAuth: true, logSecurityEvents: true });
}

/**
 * File upload security wrapper
 */
export function withFileUploadSecurity(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, { 
    rateLimit: 'upload', 
    logSecurityEvents: true 
  });
}

/**
 * Search endpoint security wrapper
 */
export function withSearchSecurity(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, { 
    rateLimit: 'search', 
    logSecurityEvents: true 
  });
}

/**
 * Authentication endpoint security wrapper
 */
export function withAuthSecurity(handler: (request: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, { 
    rateLimit: 'auth', 
    logSecurityEvents: true 
  });
}

