"use client";

import { useState, useEffect, useCallback } from 'react';
import { getStoredPermissionsConfig } from '@/services/apiService';

// Define permission type
export type Permission = 
  | 'view:dashboard'
  | 'view:imports'
  | 'view:calendar'
  | 'view:tracking'
  | 'view:scheduling'
  | 'view:storage'
  | 'view:pilot'
  | 'view:ftth_phase_b'
  | 'view:ftth_phase_b_master'
  | 'view:ftth_phase_b_autopsies'
  | 'view:billing'
  | 'view:ftth_phase_c'
  | 'view:ftth_phase_c_lastdrop'
  | 'view:mail'
  | 'view:settings'
  | 'view:users'
  | 'manage:users'
  | 'view:teams'
  | 'manage:teams'
  | 'view:roles'
  | 'manage:roles'
  | 'view:system_settings'
  | 'manage:maintenance'
  | 'manage:permissions';

// Default permissions for different roles
const defaultRolePermissions: Record<string, Permission[]> = {
  admin: [
    'view:dashboard',
    'view:imports',
    'view:calendar',
    'view:tracking',
    'view:scheduling',
    'view:storage',
    'view:pilot',
    'view:ftth_phase_b',
    'view:ftth_phase_b_master',
    'view:ftth_phase_b_autopsies', 
    'view:billing',
    'view:ftth_phase_c',
    'view:ftth_phase_c_lastdrop',
    'view:mail',
    'view:settings',
    'view:users',
    'manage:users',
    'view:teams',
    'manage:teams',
    'view:roles',
    'manage:roles',
    'view:system_settings',
    'manage:maintenance',
    'manage:permissions'
  ],
  manager: [
    'view:dashboard',
    'view:imports',
    'view:calendar',
    'view:tracking',
    'view:scheduling',
    'view:storage',
    'view:ftth_phase_b',
    'view:mail',
    'view:settings',
    'view:users',
    'view:teams'
  ],
  user: [
    'view:dashboard',
    'view:calendar',
    'view:mail'
  ]
};

// Menu items with readable names for settings
export const permissionItems = [
  { permission: 'view:dashboard', name: 'Dashboard' },
  { permission: 'view:imports', name: 'Imports' },
  { permission: 'view:calendar', name: 'Calendar' },
  { permission: 'view:tracking', name: 'Live Tracking' },
  { permission: 'view:scheduling', name: 'Smart Scheduling' },
  { permission: 'view:storage', name: 'Storage Management' },
  { permission: 'view:pilot', name: 'Pilot Project' },
  { permission: 'view:ftth_phase_b', name: 'FTTH - B Phase' },
  { permission: 'view:ftth_phase_b_master', name: 'FTTH - B Phase: Master' },
  { permission: 'view:ftth_phase_b_autopsies', name: 'FTTH - B Phase: Autopsies' },
  { permission: 'view:billing', name: 'Billing' },
  { permission: 'view:ftth_phase_c', name: 'FTTH - C Phase' },
  { permission: 'view:ftth_phase_c_lastdrop', name: 'FTTH - C Phase: Last Drop' },
  { permission: 'view:mail', name: 'Mail' },
  { permission: 'view:settings', name: 'Settings' },
  { permission: 'view:users', name: 'View Users' },
  { permission: 'manage:users', name: 'Manage Users' },
  { permission: 'view:teams', name: 'View Teams' },
  { permission: 'manage:teams', name: 'Manage Teams' },
  { permission: 'view:roles', name: 'View Roles' },
  { permission: 'manage:roles', name: 'Manage Roles' },
  { permission: 'view:system_settings', name: 'System Settings' },
  { permission: 'manage:maintenance', name: 'Maintenance Mode' },
  { permission: 'manage:permissions', name: 'Manage Permissions' }
];

// Event listener for localStorage changes
const setupStorageListener = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'permissions_config' || event.key === 'user_session') {
        callback();
      }
    });
    
    // Custom event for permission changes
    window.addEventListener('permissions_updated', callback);
  }
};

// Custom trigger for permission changes
export const triggerPermissionsUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('permissions_updated'));
  }
};

// The hook itself
export default function useEnhancedPermissions() {
  const [userRole, setUserRole] = useState<string>('user');
  const [userTeam, setUserTeam] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<any>({});
  
  // Function to update customPermissions and trigger a UI update
  const updateCustomPermissions = useCallback((newPermissions: any) => {
    setCustomPermissions(newPermissions);
    triggerPermissionsUpdate(); // Trigger update event
  }, []);
  
  // Load user data on mount and when localStorage changes
  const loadUserData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get user info from localStorage
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        const userData = JSON.parse(userSession);
        setUserId(userData.id || 'current');
        setUserFullName(userData.name || 'Current User');
        
        // Determine if admin
        const isAdminUser = 
          ['Admin', 'Administrator', 'admin', 'administrator'].includes(userData.type) || 
          userData.role === 'admin' || 
          userData.isAdmin === true;
        
        setIsAdmin(isAdminUser);
        setUserRole(isAdminUser ? 'admin' : (userData.role || 'user'));
        
        // For demo - set team from userData if available
        if (userData.teamId) {
          setUserTeam(userData.teamId);
        } else {
          setUserTeam('');
        }
        
        // Get stored custom permissions
        const config = getStoredPermissionsConfig();
        setCustomPermissions(config.permissions || {});
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);
  
  // Initial load and setup storage listener
  useEffect(() => {
    loadUserData();
    setupStorageListener(loadUserData);
    
    return () => {
      // Cleanup storage listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadUserData);
        window.removeEventListener('permissions_updated', loadUserData);
      }
    };
  }, [loadUserData]);
  
  // Calculate effective permissions whenever user data or custom permissions change
  useEffect(() => {
    if (!isLoaded) return;
    
    // Calculate permissions based on role, team, and user
    let effectivePermissions: Permission[] = [];
    
    // For admins, grant all permissions automatically
    if (isAdmin || userRole === 'admin') {
      // Add all available permissions for admins
      effectivePermissions = permissionItems.map(item => item.permission) as Permission[];
    } else {
      // Start with default role permissions
      effectivePermissions = [...(defaultRolePermissions[userRole] || defaultRolePermissions.user)];
      
      // Add custom role permissions
      if (customPermissions.roles && customPermissions.roles[userRole]) {
        effectivePermissions = [...effectivePermissions, ...customPermissions.roles[userRole]];
      }
      
      // Add custom team permissions if user has a team
      if (userTeam && customPermissions.teams && customPermissions.teams[userTeam]) {
        effectivePermissions = [...effectivePermissions, ...customPermissions.teams[userTeam]];
      }
      
      // Add custom user-specific permissions
      if (userId && customPermissions.users && customPermissions.users[userId]) {
        effectivePermissions = [...effectivePermissions, ...customPermissions.users[userId]];
      }
    }
    
    // Remove duplicates using Set
    effectivePermissions = [...new Set(effectivePermissions)];
    
    // Debug permissions
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Is Admin:', isAdmin);
    console.log('Custom Permissions:', customPermissions);
    console.log('Effective Permissions:', effectivePermissions);
    
    setPermissions(effectivePermissions);
  }, [isLoaded, userRole, userTeam, userId, customPermissions, isAdmin]);
  
  // Function to check if user has permission
  const hasPermission = useCallback((permission: string): boolean => {
    // Admin always has all permissions
    if (isAdmin || userRole === 'admin') return true;
    
    // Check if the permission is in the calculated permissions list
    return permissions.includes(permission as Permission);
  }, [permissions, isAdmin, userRole]);
  
  return {
    userRole,
    userTeam,
    userFullName,
    userId,
    permissions,
    hasPermission,
    isLoaded,
    isAdmin,
    customPermissions,
    setCustomPermissions: updateCustomPermissions // Use the wrapped version
  };
}