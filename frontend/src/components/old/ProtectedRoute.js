"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useEnhancedPermissions from '@/hooks/useEnhancedPermissions';

export default function ProtectedRoute({ children, requiredPermission }) {
  const router = useRouter();
  const { hasPermission, isLoaded, isAdmin, userRole } = useEnhancedPermissions();

  useEffect(() => {
    // Allow access if user is admin or has the specific permission
    // Only redirect if the user is not an admin AND doesn't have the required permission
    if (isLoaded && !isAdmin && userRole !== 'admin' && !hasPermission(requiredPermission)) {
      router.replace('/unauthorized');
    }
  }, [isLoaded, hasPermission, requiredPermission, router, isAdmin, userRole]);

  // Show loading while checking permissions
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is admin or has the permission, render the children
  // This ensures admins always have access without needing explicit permissions
  return (isAdmin || userRole === 'admin' || hasPermission(requiredPermission)) ? children : null;
}