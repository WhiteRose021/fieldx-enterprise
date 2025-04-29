// src/hooks/useEntityMetadata.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// Interface for field metadata
export interface FieldMetadata {
  type: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  isVisible?: boolean;
  showInList?: boolean;
  options?: Record<string, string>;
  order?: number;
  default?: any;
}

// Interface for relationship metadata
export interface RelationshipMetadata {
  type: string;
  entity: string;
  foreign: string;
  field: string;
  label: string;
  optional?: boolean;
}

// Interface for entity metadata
export interface EntityMetadata {
  entityType: string;
  displayName: string;
  labelField?: string;
  fields: Record<string, FieldMetadata>;
  relationships: Record<string, RelationshipMetadata>;
  layouts?: Record<string, any>;
}

/**
 * Convert from SWR to React Query for consistency
 * Hook to fetch all available entity types
 */
export function useAllEntityTypes() {
  return useQuery<string[], Error>({
    queryKey: ['allEntityTypes'],
    queryFn: async () => {
      const response = await apiClient.get('/api/metadata/entity-types');
      return response.types;
    },
    staleTime: 60 * 60 * 1000, // 1 hour - this data changes rarely
  });
}

/**
 * Enhanced hook to fetch complete entity metadata for the dynamic rendering system
 */
export function useEntityMetadata(entityType: string) {
  return useQuery<EntityMetadata, Error>({
    queryKey: ['entityMetadata', entityType],
    queryFn: async () => {
      // Use the new comprehensive endpoint that returns all needed metadata
      const response = await apiClient.get(`/api/dynamic-metadata/${entityType}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType,
  });
}

/**
 * Hook to fetch field definitions for an entity
 */
export function useEntityFields(entityType: string) {
  return useQuery<Record<string, FieldMetadata>, Error>({
    queryKey: ['entityFields', entityType],
    queryFn: async () => {
      const response = await apiClient.get(`/api/metadata/${entityType}/fields`);
      return response.formattedFields; // Use the formatted fields for dynamic rendering
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType,
  });
}

/**
 * Hook to fetch relationships for an entity
 */
export function useEntityRelationships(entityType: string) {
  return useQuery<Record<string, RelationshipMetadata>, Error>({
    queryKey: ['entityRelationships', entityType],
    queryFn: async () => {
      const response = await apiClient.get(`/api/metadata/${entityType}/relationships`);
      return response.relationships;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType,
  });
}

/**
 * Hook to fetch layouts for an entity
 */
export function useEntityLayouts(entityType: string) {
  return useQuery<Record<string, any>, Error>({
    queryKey: ['entityLayouts', entityType],
    queryFn: async () => {
      const response = await apiClient.get(`/api/metadata/${entityType}/layouts`);
      return response.layouts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType,
  });
}

/**
 * Hook to get dynamic logic for an entity
 */
export function useEntityDynamicLogic(entityType: string) {
  return useQuery<Record<string, any>, Error>({
    queryKey: ['entityDynamicLogic', entityType],
    queryFn: async () => {
      const response = await apiClient.get(`/api/metadata/${entityType}/dynamic-logic`);
      return response.dynamicLogic;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!entityType,
  });
}

/**
 * Hook to get event entity types (Calendar entities)
 */
export function useEventEntityTypes() {
  return useQuery<string[], Error>({
    queryKey: ['eventEntityTypes'],
    queryFn: async () => {
      const response = await apiClient.get('/api/metadata/event-entity-types');
      return response.types;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Force refresh metadata for an entity
 */
export function useRefreshEntityMetadata(entityType: string) {
  const queryClient = useQuery().queryClient;
  
  return async () => {
    await apiClient.post(`/api/metadata/${entityType}/refresh`);
    
    // Invalidate all queries related to this entity's metadata
    queryClient.invalidateQueries({ queryKey: ['entityMetadata', entityType] });
    queryClient.invalidateQueries({ queryKey: ['entityFields', entityType] });
    queryClient.invalidateQueries({ queryKey: ['entityRelationships', entityType] });
    queryClient.invalidateQueries({ queryKey: ['entityLayouts', entityType] });
    queryClient.invalidateQueries({ queryKey: ['entityDynamicLogic', entityType] });
  };
}