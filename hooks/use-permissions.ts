'use client';

import { useSession } from 'next-auth/react';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  canAccessRoute,
  canManageUsers,
  canManageOrganization,
  canDelete,
  type UserRole,
  type Permission 
} from '@/lib/permissions';

export function usePermissions() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || 'VIEWER';

  return {
    // Basic permission checks
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    
    // Route access
    canAccessRoute: (route: string) => canAccessRoute(userRole, route),
    
    // Specific permission checks
    canManageUsers: () => canManageUsers(userRole),
    canManageOrganization: () => canManageOrganization(userRole),
    canDelete: (resource: string) => canDelete(userRole, resource),
    
    // User info
    userRole,
    isAdmin: userRole === 'ADMIN',
    isLawyer: userRole === 'LAWYER',
    isParalegal: userRole === 'PARALEGAL',
    isAccountant: userRole === 'ACCOUNTANT',
    isViewer: userRole === 'VIEWER',
  };
}
