// Role-based permissions system for iLegal

export type UserRole = 'ADMIN' | 'LAWYER' | 'PARALEGAL' | 'ACCOUNTANT' | 'VIEWER';

export interface Permission {
  resource: string;
  action: string;
}

// Define all available permissions
export const PERMISSIONS = {
  // Client management
  CLIENTS_VIEW: { resource: 'clients', action: 'view' },
  CLIENTS_CREATE: { resource: 'clients', action: 'create' },
  CLIENTS_UPDATE: { resource: 'clients', action: 'update' },
  CLIENTS_DELETE: { resource: 'clients', action: 'delete' },

  // Case management
  CASES_VIEW: { resource: 'cases', action: 'view' },
  CASES_CREATE: { resource: 'cases', action: 'create' },
  CASES_UPDATE: { resource: 'cases', action: 'update' },
  CASES_DELETE: { resource: 'cases', action: 'delete' },
  CASES_ASSIGN: { resource: 'cases', action: 'assign' },

  // Document management
  DOCUMENTS_VIEW: { resource: 'documents', action: 'view' },
  DOCUMENTS_CREATE: { resource: 'documents', action: 'create' },
  DOCUMENTS_UPDATE: { resource: 'documents', action: 'update' },
  DOCUMENTS_DELETE: { resource: 'documents', action: 'delete' },
  DOCUMENTS_DOWNLOAD: { resource: 'documents', action: 'download' },

  // Time tracking
  TIME_ENTRIES_VIEW: { resource: 'time_entries', action: 'view' },
  TIME_ENTRIES_CREATE: { resource: 'time_entries', action: 'create' },
  TIME_ENTRIES_UPDATE: { resource: 'time_entries', action: 'update' },
  TIME_ENTRIES_DELETE: { resource: 'time_entries', action: 'delete' },

  // Billing and invoices
  INVOICES_VIEW: { resource: 'invoices', action: 'view' },
  INVOICES_CREATE: { resource: 'invoices', action: 'create' },
  INVOICES_UPDATE: { resource: 'invoices', action: 'update' },
  INVOICES_DELETE: { resource: 'invoices', action: 'delete' },
  INVOICES_SEND: { resource: 'invoices', action: 'send' },

  // Expense management
  EXPENSES_VIEW: { resource: 'expenses', action: 'view' },
  EXPENSES_CREATE: { resource: 'expenses', action: 'create' },
  EXPENSES_UPDATE: { resource: 'expenses', action: 'update' },
  EXPENSES_DELETE: { resource: 'expenses', action: 'delete' },

  // User management
  USERS_VIEW: { resource: 'users', action: 'view' },
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  USERS_INVITE: { resource: 'users', action: 'invite' },

  // Organization settings
  ORGANIZATION_VIEW: { resource: 'organization', action: 'view' },
  ORGANIZATION_UPDATE: { resource: 'organization', action: 'update' },
  ORGANIZATION_BILLING: { resource: 'organization', action: 'billing' },

  // Reports and analytics
  REPORTS_VIEW: { resource: 'reports', action: 'view' },
  REPORTS_EXPORT: { resource: 'reports', action: 'export' },

  // Audit logs
  AUDIT_VIEW: { resource: 'audit', action: 'view' },
} as const;

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Admins have all permissions
    ...Object.values(PERMISSIONS),
  ],

  LAWYER: [
    // Full access to clients, cases, documents, time tracking
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CLIENTS_DELETE,
    
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CASES_CREATE,
    PERMISSIONS.CASES_UPDATE,
    PERMISSIONS.CASES_DELETE,
    PERMISSIONS.CASES_ASSIGN,
    
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DOCUMENTS_UPDATE,
    PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    
    PERMISSIONS.TIME_ENTRIES_VIEW,
    PERMISSIONS.TIME_ENTRIES_CREATE,
    PERMISSIONS.TIME_ENTRIES_UPDATE,
    PERMISSIONS.TIME_ENTRIES_DELETE,
    
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.INVOICES_SEND,
    
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_CREATE,
    PERMISSIONS.EXPENSES_UPDATE,
    PERMISSIONS.EXPENSES_DELETE,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  PARALEGAL: [
    // Can work with clients, cases, documents, but limited billing access
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CASES_CREATE,
    PERMISSIONS.CASES_UPDATE,
    
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_CREATE,
    PERMISSIONS.DOCUMENTS_UPDATE,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    
    PERMISSIONS.TIME_ENTRIES_VIEW,
    PERMISSIONS.TIME_ENTRIES_CREATE,
    PERMISSIONS.TIME_ENTRIES_UPDATE,
    
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],

  ACCOUNTANT: [
    // Focus on billing, invoices, and financial data
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CASES_VIEW,
    
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    
    PERMISSIONS.TIME_ENTRIES_VIEW,
    
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.INVOICES_DELETE,
    PERMISSIONS.INVOICES_SEND,
    
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_CREATE,
    PERMISSIONS.EXPENSES_UPDATE,
    PERMISSIONS.EXPENSES_DELETE,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  VIEWER: [
    // Read-only access to most data
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_DOWNLOAD,
    PERMISSIONS.TIME_ENTRIES_VIEW,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.some(p => 
    p.resource === permission.resource && p.action === permission.action
  );
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard': [PERMISSIONS.CLIENTS_VIEW],
    '/dashboard/clients': [PERMISSIONS.CLIENTS_VIEW],
    '/dashboard/cases': [PERMISSIONS.CASES_VIEW],
    '/dashboard/documents': [PERMISSIONS.DOCUMENTS_VIEW],
    '/dashboard/time-tracking': [PERMISSIONS.TIME_ENTRIES_VIEW],
    '/dashboard/invoices': [PERMISSIONS.INVOICES_VIEW],
    '/dashboard/users': [PERMISSIONS.USERS_VIEW],
    '/dashboard/settings': [PERMISSIONS.ORGANIZATION_VIEW],
    '/dashboard/reports': [PERMISSIONS.REPORTS_VIEW],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    return true; // Allow access to routes not in the list
  }

  return hasAnyPermission(userRole, requiredPermissions);
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    LAWYER: 'Odvjetnik',
    PARALEGAL: 'Pravni pomoćnik',
    ACCOUNTANT: 'Računovođa',
    VIEWER: 'Preglednik',
  };

  return roleNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    ADMIN: 'Pun pristup svim funkcionalnostima sustava',
    LAWYER: 'Pun pristup klijentima, predmetima, dokumentima i naplati',
    PARALEGAL: 'Pristup klijentima, predmetima i dokumentima (ograničena naplata)',
    ACCOUNTANT: 'Fokus na naplatu, račune i financijske podatke',
    VIEWER: 'Samo pregled podataka (read-only)',
  };

  return descriptions[role] || 'Nepoznata uloga';
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.USERS_CREATE) || 
         hasPermission(userRole, PERMISSIONS.USERS_UPDATE) || 
         hasPermission(userRole, PERMISSIONS.USERS_DELETE);
}

/**
 * Check if user can manage organization settings
 */
export function canManageOrganization(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.ORGANIZATION_UPDATE) || 
         hasPermission(userRole, PERMISSIONS.ORGANIZATION_BILLING);
}

/**
 * Check if user can delete records
 */
export function canDelete(userRole: UserRole, resource: string): boolean {
  const deletePermissions: Record<string, Permission> = {
    clients: PERMISSIONS.CLIENTS_DELETE,
    cases: PERMISSIONS.CASES_DELETE,
    documents: PERMISSIONS.DOCUMENTS_DELETE,
    time_entries: PERMISSIONS.TIME_ENTRIES_DELETE,
    invoices: PERMISSIONS.INVOICES_DELETE,
    users: PERMISSIONS.USERS_DELETE,
  };

  const permission = deletePermissions[resource];
  return permission ? hasPermission(userRole, permission) : false;
}
