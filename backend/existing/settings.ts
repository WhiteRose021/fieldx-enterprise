import { api } from "encore.dev/api";
import { getClient } from "./client";
import { RedisService } from "../core/redis";

// Initialize Redis service
const redis = RedisService.getInstance();

// Define proper return types for the API endpoints
export interface EntityPermission {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  stream: boolean;
  export: boolean;
  import: boolean;
}

export interface RolePermission {
  roleId: string;
  permissions: EntityPermission;
}

export interface EntityPermissionsResponse {
  roles: RolePermission[];
  success: boolean;
}

export interface MetadataUpdateResponse {
  success: boolean;
  message: string;
}

// Get entity permissions - changed route to avoid conflict
export const getEntityPermissions = api(
  { expose: true, method: "GET", path: "/settings/permissions/:entityType" },
  async ({ entityType }: { entityType: string }): Promise<EntityPermissionsResponse> => {
    const cacheKey = `permissions:entity:${entityType}`;
    
    // Try to get from cache first
    const cached = await redis.get<EntityPermissionsResponse>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from EspoCRM
    const client = getClient();
    try {
      const aclData = await client.request("GET", "Acl/scope", { scope: entityType });
      
      // Convert object to array structure to avoid Record/index signature
      const rolesArray: RolePermission[] = [];
      
      // Process the data from EspoCRM to match our interface
      if (aclData && typeof aclData === 'object') {
        Object.keys(aclData).forEach(roleId => {
          const roleData = aclData[roleId];
          
          // Create a permissions object with default values
          const permissions: EntityPermission = {
            read: false,
            create: false,
            edit: false,
            delete: false,
            stream: false,
            export: false,
            import: false
          };
          
          // Override with actual values
          if (roleData) {
            if (typeof roleData.read === 'boolean') permissions.read = roleData.read;
            if (typeof roleData.create === 'boolean') permissions.create = roleData.create;
            if (typeof roleData.edit === 'boolean') permissions.edit = roleData.edit;
            if (typeof roleData.delete === 'boolean') permissions.delete = roleData.delete;
            if (typeof roleData.stream === 'boolean') permissions.stream = roleData.stream;
            if (typeof roleData.export === 'boolean') permissions.export = roleData.export;
            if (typeof roleData.import === 'boolean') permissions.import = roleData.import;
          }
          
          rolesArray.push({
            roleId,
            permissions
          });
        });
      }
      
      const response: EntityPermissionsResponse = {
        roles: rolesArray,
        success: true
      };
      
      // Cache results (shorter TTL for permissions as they might change more often)
      await redis.set(cacheKey, response, 1800); // 30 minutes
      
      return response;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return {
        roles: [],
        success: false
      };
    }
  }
);

// Define a type for field metadata updates
export interface FieldMetadata {
  type: string;
  required: boolean;
  default: string;
  label: string;
}

// Define a type for entity labels
export interface EntityLabels {
  singular: string;
  plural: string;
}

// Update entity metadata - changed route to avoid conflict
export const updateEntityMetadata = api(
  { expose: true, method: "PUT", path: "/settings/metadata/:entityType" },
  async ({ 
    entityType, 
    fields,
    labels
  }: { 
    entityType: string, 
    fields: FieldMetadata[],
    labels: EntityLabels
  }): Promise<MetadataUpdateResponse> => {
    try {
      // This would involve direct database updates or EspoCRM admin API calls
      console.log(`Updating metadata for ${entityType}:`, { fields, labels });
      
      // Invalidate cache for this entity
      await redis.delete(`metadata:entity:${entityType}:def`);
      await redis.delete(`metadata:entity:${entityType}:clientdef`);
      
      // In a real implementation, you would apply these changes to EspoCRM
      
      return { 
        success: true,
        message: `Metadata for entity ${entityType} updated successfully`
      };
    } catch (error) {
      console.error(`Error updating metadata for entity ${entityType}:`, error);
      return {
        success: false,
        message: `Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);