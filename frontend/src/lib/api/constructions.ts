// lib/api/constructions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Construction {
  id: string;
  name: string;
  // Add all other fields matching the backend interface
  address?: string;
  status?: string;
  orderNumber?: string;
  createdAt?: string;
  modifiedAt?: string;
  // ...other fields
}

// Fetch single Construction
export const useConstruction = (id: string) => {
  return useQuery({
    queryKey: ['construction', id],
    queryFn: async () => {
      return apiClient.getEntity<Construction>('constructions', id);
    },
    enabled: !!id,
  });
};

// Fetch multiple Constructions
export const useConstructionsList = (params = {}) => {
  return useQuery({
    queryKey: ['constructionsList', params],
    queryFn: async () => {
      return apiClient.getEntities<Construction>('constructions', params);
    },
  });
};

// Create new Construction
export const useCreateConstruction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Construction>) => {
      return apiClient.createEntity<Construction>('constructions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructionsList'] });
    },
  });
};

// Update Construction
export const useUpdateConstruction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Construction> }) => {
      return apiClient.updateEntity<Construction>('constructions', id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['construction', data.id] });
      queryClient.invalidateQueries({ queryKey: ['constructionsList'] });
    },
  });
};

// Delete Construction
export const useDeleteConstruction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      return apiClient.deleteEntity('constructions', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructionsList'] });
    },
  });
};