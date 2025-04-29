// frontend/hooks/useEntity.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Entity, ListParams } from '../../../shared/types';

// Enhanced hook for listing entities with support for dynamic filtering
export function useEntities<T extends Entity>(
  entityType: string,
  params?: ListParams,
  options = {}
) {
  return useQuery({
    queryKey: ['entities', entityType, params],
    queryFn: () => apiClient.getEntities<T>(entityType, params),
    ...options,
  });
}

// Hook for getting a single entity
export function useEntity<T extends Entity>(
  entityType: string,
  id: string,
  options = {}
) {
  return useQuery({
    queryKey: ['entity', entityType, id],
    queryFn: () => apiClient.getEntity<T>(entityType, id),
    enabled: !!id,
    ...options,
  });
}

// NEW: Hook for getting related entities
export function useRelatedEntities<T extends Entity>(
  entityType: string,
  entityId: string,
  relationship: string,
  params?: { 
    limit?: number; 
    offset?: number; 
    orderBy?: string; 
    orderDirection?: 'asc' | 'desc' 
  },
  options = {}
) {
  return useQuery({
    queryKey: ['relatedEntities', entityType, entityId, relationship, params],
    queryFn: () => apiClient.getRelatedEntities<T>(entityType, entityId, relationship, params),
    enabled: !!entityId && !!relationship,
    ...options,
  });
}

// NEW: Hook to check if a relationship exists and has data
export function useRelationshipExists(
  entityType: string,
  entityId: string,
  relationship: string,
  options = {}
) {
  return useQuery({
    queryKey: ['relationshipExists', entityType, entityId, relationship],
    queryFn: () => apiClient.checkRelationshipExists(entityType, entityId, relationship),
    enabled: !!entityId && !!relationship,
    ...options,
  });
}

// Hook for creating an entity
export function useCreateEntity<T extends Entity>(entityType: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<T>) => 
      apiClient.createEntity<T>(entityType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
    },
  });
}

// Hook for updating an entity
export function useUpdateEntity<T extends Entity>(entityType: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => 
      apiClient.updateEntity<T>(entityType, id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityType, data.id] });
      queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
    },
  });
}

// Hook for deleting an entity
export function useDeleteEntity(entityType: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      apiClient.deleteEntity(entityType, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityType, id] });
      queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
    },
  });
}

// Hook for searching entities
export function useSearch(query: string, entityTypes?: string[], maxSize?: number) {
  return useQuery({
    queryKey: ['search', query, entityTypes, maxSize],
    queryFn: () => apiClient.search(query, entityTypes, maxSize),
    enabled: query.length > 2, // Only search when query is at least 3 characters
  });
}

// NEW: Hook for entity list with pagination, sorting, and filtering
export function useEntityList(
  entityType: string,
  { 
    page = 1, 
    limit = 50, 
    searchText = '',
    filters = {},
    sortField = 'id',
    sortDirection = 'asc'
  } = {}
) {
  return useQuery({
    queryKey: ['entityList', entityType, page, limit, searchText, filters, sortField, sortDirection],
    queryFn: async () => {
      // Convert the parameters to the format expected by the API
      const params = {
        offset: (page - 1) * limit,
        limit,
        orderBy: sortField,
        orderDirection: sortDirection,
        searchText,
        ...filters
      };
      
      return apiClient.getEntities(entityType, params);
    },
  });
}