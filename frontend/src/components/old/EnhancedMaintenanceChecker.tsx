// components/EnhancedMaintenanceChecker.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Define the maintenance page path
const MAINTENANCE_PAGE = "/settings/maintenance";

// Only paths allowed during maintenance
const ALLOWED_PATHS = [
  '/auth/signin', 
  '/auth/signup',
  MAINTENANCE_PAGE,
  '/admin/maintenance' // Admin can access the maintenance control page
];

/**
 * Enhanced component that enforces maintenance mode restrictions
 * and redirects users to the maintenance page
 */
export default function EnhancedMaintenanceChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin and determine if maintenance mode is active
    const checkMaintenanceAndAccess = async () => {
      // Skip all checks if we're on the maintenance page already to prevent redirect loops
      if (pathname === MAINTENANCE_PAGE) {
        return;
      }
      
      // Check for admin status from multiple sources
      const isAdminCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('is_admin='))?.split('=')[1] === 'true';
        
      const userRoleCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_role='))?.split('=')[1] === 'admin';
      
      let sessionAdmin = false;
      try {
        const userSession = localStorage.getItem('user_session');
        if (userSession) {
          const userData = JSON.parse(userSession);
          sessionAdmin = userData.isAdmin === true || 
                        userData.role === 'admin' || 
                        ['Admin', 'Administrator', 'admin', 'administrator'].includes(userData.type);
        }
      } catch (e) {
        console.error('Error parsing user session:', e);
      }
      
      // Combine admin checks
      const adminStatus = isAdminCookie || userRoleCookie || sessionAdmin;
      setIsAdmin(adminStatus);
      
      // Check if maintenance mode is active from cookies or localStorage
      const maintenanceCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('maintenance_mode='))?.split('=')[1] === 'true';
        
      const maintenanceStorage = localStorage.getItem('maintenance_mode') === 'true';
      const maintenanceMode = maintenanceCookie || maintenanceStorage;
      
      console.log('Maintenance check:', {
        path: pathname,
        maintenanceMode,
        isAdmin: adminStatus,
        isAllowedPath: ALLOWED_PATHS.includes(pathname || '')
      });
      
      // If maintenance mode is active:
      if (maintenanceMode) {
        // Admin users can access any page
        if (adminStatus) {
          return;
        }
        
        // Non-admin users can only access allowed paths during maintenance
        if (!ALLOWED_PATHS.includes(pathname || '')) {
          console.log('Redirecting to maintenance page from:', pathname);
          router.push(MAINTENANCE_PAGE);
        }
      }
    };
    
    // Run initial check
    checkMaintenanceAndAccess();
    
    // Setup listener for maintenance mode changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'maintenance_broadcast') {
        console.log('Maintenance broadcast received');
        try {
          if (event.newValue) {
            const data = JSON.parse(event.newValue);
            
            // Update maintenance cookies and localStorage
            document.cookie = `maintenance_mode=${data.value}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('maintenance_mode', data.value.toString());
            
            // If maintenance was enabled and user is not admin, redirect to maintenance page
            if (data.value === true && !isAdmin && pathname !== MAINTENANCE_PAGE) {
              router.push(MAINTENANCE_PAGE);
            }
          }
        } catch (error) {
          console.error('Error handling maintenance broadcast:', error);
        }
      }
    };
    
    // Listen for changes in other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Set up interval for periodic checks (every 15 seconds)
    const interval = setInterval(checkMaintenanceAndAccess, 15000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname, router, isAdmin]);
  
  // This component doesn't render anything visible
  return null;
}