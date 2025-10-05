import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Security Utilities
 * Implements input validation, rate limiting, CSRF protection, and security headers
 */

// Rate limiting configuration - only if Redis is configured
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Different rate limits for different endpoints - only if Redis is available
export const rateLimits = redis ? {
  // Authentication endpoints - stricter limits
  auth: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
    analytics: true,
  }),
  
  // API endpoints - moderate limits
  api: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),
  
  // File upload endpoints - stricter limits
  upload: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 uploads per minute
    analytics: true,
  }),
  
  // Search endpoints - moderate limits
  search: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 searches per minute
    analytics: true,
  }),
} : null;

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  limitType: keyof NonNullable<typeof rateLimits> = 'api'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    // If rate limiting is not configured, allow all requests
    if (!rateLimits) {
      return { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    const identifier = getClientIdentifier(request);
    const { success, limit, remaining, reset } = await rateLimits[limitType].limit(identifier);
    
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request if rate limiting fails
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session if available
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const ip = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * Input validation schemas using Zod
 */
export const validationSchemas = {
  // User registration
  userRegistration: z.object({
    email: z.string().email('Neispravna email adresa'),
    password: z.string().min(8, 'Lozinka mora imati najmanje 8 znakova'),
    firstName: z.string().min(1, 'Ime je obavezno'),
    lastName: z.string().min(1, 'Prezime je obavezno'),
    organizationName: z.string().min(1, 'Naziv organizacije je obavezan'),
  }),
  
  // User login
  userLogin: z.object({
    email: z.string().email('Neispravna email adresa'),
    password: z.string().min(1, 'Lozinka je obavezna'),
  }),
  
  // 2FA verification
  twoFactorVerification: z.object({
    code: z.string().regex(/^(\d{6}|[A-Z0-9]{8})$/, 'Neispravan format koda'),
  }),
  
  // Document upload
  documentUpload: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    caseId: z.string().optional(),
    clientId: z.string().optional(),
  }),
  
  // Case creation
  caseCreation: z.object({
    title: z.string().min(1, 'Naziv slučaja je obavezan'),
    description: z.string().optional(),
    caseType: z.string().min(1, 'Tip slučaja je obavezan'),
    clientId: z.string().min(1, 'Klijent je obavezan'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    estimatedValue: z.number().positive().optional(),
  }),
  
  // Client creation
  clientCreation: z.object({
    clientType: z.enum(['INDIVIDUAL', 'COMPANY']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('Croatia'),
    personalId: z.string().optional(),
    taxId: z.string().optional(),
  }),
  
  // Time entry
  timeEntry: z.object({
    date: z.string().datetime(),
    duration: z.number().positive('Trajanje mora biti pozitivno'),
    description: z.string().min(1, 'Opis je obavezan'),
    hourlyRate: z.number().positive('Satnica mora biti pozitivna'),
    caseId: z.string().optional(),
  }),
  
  // Invoice creation
  invoiceCreation: z.object({
    clientId: z.string().min(1, 'Klijent je obavezan'),
    dueDate: z.string().datetime(),
    notes: z.string().optional(),
    terms: z.string().optional(),
  }),
};

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Neispravni podaci'] };
  }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .trim();
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  // In a real implementation, you would store and verify the token
  // For now, we'll use a simple comparison
  return token === sessionToken;
}

/**
 * Security headers middleware
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Datoteka je prevelika. Maksimalna veličina je 50MB.' };
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tip datoteke nije podržan.' };
  }
  
  // Check file name
  if (file.name.length > 255) {
    return { valid: false, error: 'Naziv datoteke je predugačak.' };
  }
  
  return { valid: true };
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request: NextRequest
): Promise<void> {
  try {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: request.method,
    };
    
    console.warn('Security Event:', securityLog);
    
    // In production, you would send this to a security monitoring service
    // like Sentry, DataDog, or a custom security dashboard
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Croatian translations for security messages
 */
export const securityMessages = {
  rateLimit: {
    exceeded: 'Previše zahtjeva. Molimo pokušajte ponovno kasnije.',
    retryAfter: 'Pokušajte ponovno za {seconds} sekundi.'
  },
  validation: {
    required: 'Polje je obavezno',
    invalidEmail: 'Neispravna email adresa',
    passwordTooShort: 'Lozinka mora imati najmanje 8 znakova',
    invalidFormat: 'Neispravan format podataka'
  },
  csrf: {
    invalidToken: 'Neispravan CSRF token',
    missingToken: 'CSRF token je obavezan'
  },
  fileUpload: {
    tooLarge: 'Datoteka je prevelika',
    invalidType: 'Tip datoteke nije podržan',
    nameTooLong: 'Naziv datoteke je predugačak'
  },
  security: {
    accessDenied: 'Pristup odbijen',
    unauthorized: 'Neautoriziran pristup',
    forbidden: 'Zabranjen pristup'
  }
};
