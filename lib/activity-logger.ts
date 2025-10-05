import { db } from './db';
import { NextRequest } from 'next/server';

interface CreateActivityLogProps {
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  organizationId: string;
  changes?: string; // JSON string of changes
  ipAddress?: string;
  userAgent?: string;
  request?: NextRequest; // Optional request object for automatic IP/UA extraction
}

/**
 * Extract client IP address from request
 */
function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown';
  
  // Check various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const clientIP = request.ip;
  
  // Priority order: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > request.ip
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (clientIP) return clientIP;
  
  return 'unknown';
}

/**
 * Extract user agent from request
 */
function getUserAgent(request?: NextRequest): string {
  if (!request) return 'unknown';
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Create activity log with enhanced IP and user agent tracking
 */
export async function createActivityLog({
  action,
  entity,
  entityId,
  userId,
  organizationId,
  changes,
  ipAddress,
  userAgent,
  request,
}: CreateActivityLogProps) {
  try {
    // Extract IP and user agent from request if not provided
    const finalIP = ipAddress || getClientIP(request);
    const finalUserAgent = userAgent || getUserAgent(request);
    
    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        organizationId,
        changes,
        ipAddress: finalIP,
        userAgent: finalUserAgent,
      },
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Optionally, implement a more robust error handling for logging failures
  }
}

/**
 * Enhanced activity logger with automatic request context
 */
export async function logActivity(
  props: Omit<CreateActivityLogProps, 'ipAddress' | 'userAgent'> & {
    request?: NextRequest;
  }
) {
  return createActivityLog(props);
}

/**
 * Log security-related activities
 */
export async function logSecurityActivity(
  action: string,
  details: Record<string, any>,
  userId: string,
  organizationId: string,
  request?: NextRequest
) {
  return createActivityLog({
    action: `SECURITY_${action}`,
    entity: 'Security',
    entityId: 'security',
    userId,
    organizationId,
    changes: JSON.stringify(details),
    request
  });
}

/**
 * Log user authentication activities
 */
export async function logAuthActivity(
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | '2FA_ENABLED' | '2FA_DISABLED',
  userId: string,
  organizationId: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  return createActivityLog({
    action: `AUTH_${action}`,
    entity: 'User',
    entityId: userId,
    userId,
    organizationId,
    changes: details ? JSON.stringify(details) : undefined,
    request
  });
}

/**
 * Log document activities
 */
export async function logDocumentActivity(
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'VIEW' | 'UPDATE',
  documentId: string,
  userId: string,
  organizationId: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  return createActivityLog({
    action: `DOCUMENT_${action}`,
    entity: 'Document',
    entityId: documentId,
    userId,
    organizationId,
    changes: details ? JSON.stringify(details) : undefined,
    request
  });
}

/**
 * Log case activities
 */
export async function logCaseActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'ASSIGN' | 'STATUS_CHANGE',
  caseId: string,
  userId: string,
  organizationId: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  return createActivityLog({
    action: `CASE_${action}`,
    entity: 'Case',
    entityId: caseId,
    userId,
    organizationId,
    changes: details ? JSON.stringify(details) : undefined,
    request
  });
}

/**
 * Log client activities
 */
export async function logClientActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
  clientId: string,
  userId: string,
  organizationId: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  return createActivityLog({
    action: `CLIENT_${action}`,
    entity: 'Client',
    entityId: clientId,
    userId,
    organizationId,
    changes: details ? JSON.stringify(details) : undefined,
    request
  });
}

/**
 * Log invoice activities
 */
export async function logInvoiceActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'SEND' | 'PAY',
  invoiceId: string,
  userId: string,
  organizationId: string,
  details?: Record<string, any>,
  request?: NextRequest
) {
  return createActivityLog({
    action: `INVOICE_${action}`,
    entity: 'Invoice',
    entityId: invoiceId,
    userId,
    organizationId,
    changes: details ? JSON.stringify(details) : undefined,
    request
  });
}

/**
 * Croatian translations for activity log actions
 */
export const activityLogTranslations = {
  // Authentication
  'AUTH_LOGIN': 'Prijava korisnika',
  'AUTH_LOGOUT': 'Odjava korisnika',
  'AUTH_LOGIN_FAILED': 'Neuspješna prijava',
  'AUTH_PASSWORD_CHANGE': 'Promjena lozinke',
  'AUTH_2FA_ENABLED': 'Omogućena 2FA',
  'AUTH_2FA_DISABLED': 'Onemogućena 2FA',
  
  // Documents
  'DOCUMENT_UPLOAD': 'Učitavanje dokumenta',
  'DOCUMENT_DOWNLOAD': 'Preuzimanje dokumenta',
  'DOCUMENT_DELETE': 'Brisanje dokumenta',
  'DOCUMENT_VIEW': 'Pregled dokumenta',
  'DOCUMENT_UPDATE': 'Ažuriranje dokumenta',
  
  // Cases
  'CASE_CREATE': 'Kreiranje slučaja',
  'CASE_UPDATE': 'Ažuriranje slučaja',
  'CASE_DELETE': 'Brisanje slučaja',
  'CASE_VIEW': 'Pregled slučaja',
  'CASE_ASSIGN': 'Dodjela slučaja',
  'CASE_STATUS_CHANGE': 'Promjena statusa slučaja',
  
  // Clients
  'CLIENT_CREATE': 'Kreiranje klijenta',
  'CLIENT_UPDATE': 'Ažuriranje klijenta',
  'CLIENT_DELETE': 'Brisanje klijenta',
  'CLIENT_VIEW': 'Pregled klijenta',
  
  // Invoices
  'INVOICE_CREATE': 'Kreiranje računa',
  'INVOICE_UPDATE': 'Ažuriranje računa',
  'INVOICE_DELETE': 'Brisanje računa',
  'INVOICE_VIEW': 'Pregled računa',
  'INVOICE_SEND': 'Slanje računa',
  'INVOICE_PAY': 'Plaćanje računa',
  
  // Security
  'SECURITY_RATE_LIMIT_EXCEEDED': 'Prekoračenje ograničenja brzine',
  'SECURITY_INPUT_VALIDATION_FAILED': 'Neuspješna validacija podataka',
  'SECURITY_UNAUTHORIZED_ACCESS': 'Neovlašten pristup',
  'SECURITY_SUSPICIOUS_ACTIVITY': 'Sumnjiva aktivnost',
};