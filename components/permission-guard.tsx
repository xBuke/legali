'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { type Permission } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  hideIfNoPermission?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  hideIfNoPermission = true,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // If no permissions specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (hideIfNoPermission) {
      return null;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common permission checks
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = usePermissions();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function LawyerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isLawyer, isAdmin } = usePermissions();
  
  if (!isLawyer && !isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function NotViewerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isViewer } = usePermissions();
  
  if (isViewer) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
