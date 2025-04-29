// src/hooks/usePermissions.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

// Types for permissions
export interface FieldPermission {
  read: boolean;
  edit: boolean;
}

export interface EntityPermissions {
  create: boolean;
  read: boolean;
  edit: boolean;
  delete: boolean;
  fields: Record<string, FieldPermission>;
}

export interface UserPermissions {
  userId: string;
  isAdmin: boolean;
  entities: Record<string, EntityPermissions>;
}

// Interface for API success response
interface SuccessResponse {
  success: boolean;
}

/**
 * Hook to fetch and check user permissions for a specific entity
 */
export function usePermissions(entityType: string) {
  const { user } = useAuth();
  
  // Fetch user permissions
  const { data: permissions, isLoading, error } = useQuery<UserPermissions, Error>({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return apiClient.get(`/permissions/user/${user.id}`);
    },
    // Don't attempt to fetch if user is not logged in
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Check if the user is an admin
  const isAdmin = permissions?.isAdmin || false;
  
  // Get entity-specific permissions
  const entityPermissions = permissions?.entities?.[entityType];
  
  /**
   * Check if the user can create entities of this type
   */
  const canCreate = (): boolean => {
    // Admins can do everything
    if (isAdmin) return true;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return false;
    
    return entityPermissions.create;
  };
  
  /**
   * Check if the user can read either the entire entity or a specific field
   */
  const canRead = (fieldName?: string): boolean => {
    // Admins can do everything
    if (isAdmin) return true;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return false;
    
    // If no field specified, check entity-level read permission
    if (!fieldName) {
      return entityPermissions.read;
    }
    
    // Check field-specific read permission if available
    if (entityPermissions.fields[fieldName]) {
      return entityPermissions.fields[fieldName].read;
    }
    
    // Fall back to entity-level permission if no field-specific permission exists
    return entityPermissions.read;
  };
  
  /**
   * Check if the user can edit either the entire entity or a specific field
   */
  const canEdit = (fieldName?: string): boolean => {
    // Admins can do everything
    if (isAdmin) return true;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return false;
    
    // If no field specified, check entity-level edit permission
    if (!fieldName) {
      return entityPermissions.edit;
    }
    
    // Check field-specific edit permission if available
    if (entityPermissions.fields[fieldName]) {
      return entityPermissions.fields[fieldName].edit;
    }
    
    // Fall back to entity-level permission if no field-specific permission exists
    return entityPermissions.edit;
  };
  
  /**
   * Check if the user can delete entities of this type
   */
  const canDelete = (): boolean => {
    // Admins can do everything
    if (isAdmin) return true;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return false;
    
    return entityPermissions.delete;
  };
  
  /**
   * Get list of field names that the user can read
   */
  const getReadableFields = (allFields: string[]): string[] => {
    // Admins can read all fields
    if (isAdmin) return allFields;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return [];
    
    // Filter fields based on read permissions
    return allFields.filter(fieldName => {
      // Check field-specific permission first
      if (entityPermissions.fields[fieldName]) {
        return entityPermissions.fields[fieldName].read;
      }
      
      // Fall back to entity-level permission
      return entityPermissions.read;
    });
  };
  
  /**
   * Get list of field names that the user can edit
   */
  const getEditableFields = (allFields: string[]): string[] => {
    // Admins can edit all fields
    if (isAdmin) return allFields;
    
    // No permissions loaded yet or no permissions for this entity
    if (!entityPermissions) return [];
    
    // Filter fields based on edit permissions
    return allFields.filter(fieldName => {
      // Check field-specific permission first
      if (entityPermissions.fields[fieldName]) {
        return entityPermissions.fields[fieldName].edit;
      }
      
      // Fall back to entity-level permission
      return entityPermissions.edit;
    });
  };
  
  return {
    isLoading,
    error,
    isAdmin,
    canCreate,
    canRead,
    canEdit,
    canDelete,
    getReadableFields,
    getEditableFields,
    // Expose raw permissions for more complex checks
    permissions: entityPermissions,
  };
}

/**
 * Hook to check if a user has access to an entity or feature
 */
export function useHasAccess() {
  const { user } = useAuth();
  
  // Fetch all user permissions
  const { data: permissions, isLoading } = useQuery<UserPermissions, Error>({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      return apiClient.get(`/permissions/user/${user.id}`);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  /**
   * Check if the user has access to a specific entity type
   */
  const hasEntityAccess = (entityType: string): boolean => {
    // If permissions are still loading, default to false
    if (isLoading || !permissions) return false;
    
    // Admins have access to everything
    if (permissions.isAdmin) return true;
    
    // Check if the entity exists in permissions and has at least read access
    return !!permissions.entities[entityType]?.read;
  };
  
  /**
   * Check if the user has access to a feature or section of the app
   * This is for custom features not directly tied to entities
   */
  const hasFeatureAccess = (featureKey: string): boolean => {
    // If permissions are still loading, default to false
    if (isLoading || !permissions) return false;
    
    // Admins have access to everything
    if (permissions.isAdmin) return true;
    
    // In a real implementation, you'd check a features map in the permissions
    // This is a placeholder implementation - you would need to extend the
    // permissions model on the backend to include features
    return false;
  };
  
  /**
   * Get list of entity types that the user has access to
   */
  const getAccessibleEntities = (): string[] => {
    // If permissions are still loading, return empty array
    if (isLoading || !permissions) return [];
    
    // For admins, you'd want to return all entities
    // In a real implementation, you'd fetch the complete list of entities
    if (permissions.isAdmin) {
      return Object.keys(permissions.entities);
    }
    
    // Filter entities based on read permissions
    return Object.entries(permissions.entities)
      .filter(([, entityPerms]) => entityPerms.read)
      .map(([entityType]) => entityType);
  };
  
  /**
   * Clear the user's permission cache (useful after role changes)
   */
  const clearPermissionCache = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const response = await apiClient.post<SuccessResponse>(`/permissions/user/${user.id}/clear-cache`, {});
      return response.success;
    } catch (error) {
      console.error('Failed to clear permission cache:', error);
      return false;
    }
  };
  
  return {
    isLoading,
    hasEntityAccess,
    hasFeatureAccess,
    getAccessibleEntities,
    clearPermissionCache,
  };
}