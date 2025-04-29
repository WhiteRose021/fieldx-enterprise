// lib/api/malfunctions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

// Types
export interface Malfunction {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  modifiedAt: string;
  type?: string[] | null;
  idvlavis?: string;
  perioxi?: string | null;
  tk?: string | null;
  ak?: string;
  lat?: string;
  long?: string;
  ttlp?: string;
  addresslink?: string | null;
  address?: string;
  datecreated?: string | null;
  customername?: string | null;
  customermobile?: string | null;
  addressformatted?: string | null;
  cab?: string | null;
  blowingDone?: string | null;
  textdatestart?: string | null;
  metravlavhcab?: number | string | null;
  metravlavhbcpbep?: string | null;
  metravlavhbepfb?: string | null;
  splittertype?: string | null;
  splitterbcp?: string | null;
  moufarisma?: string | null;
  jobdescription?: string | null;
  
  // Link fields
  createdById?: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  
  // Link multiple fields
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  usersIds?: string[];
  usersNames?: Record<string, string>;
  
  // Attachment fields
  photosIds?: string[];
  photosNames?: Record<string, string>;
  photosTypes?: Record<string, string>;
  soilphotosIds?: string[];
  soilphotosNames?: Record<string, string>;
  soilphotosTypes?: Record<string, string>;
  pdfattachmentIds?: string[];
  pdfattachmentNames?: Record<string, string>;
  pdfattachmentTypes?: Record<string, string>;
  
  [key: string]: any;
}

export interface MalfunctionsResponse {
  list: Malfunction[];
  total: number;
}

export interface MalfunctionStatsResponse {
  total: number;
  completed: number;
  pending: number;
  sent: number;
}

export interface Filters {
  status: string;
  ttlp: string;
  dateFrom: string;
  dateTo: string;
  ak: string;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

// Function to fetch malfunctions list with query params
const fetchMalfunctions = async (
  page: number,
  limit: number,
  searchTerm: string,
  filters: Filters,
  sortConfig: SortConfig
): Promise<MalfunctionsResponse> => {
  const offset = (page - 1) * limit;
  
  // Build params for API request
  const params: Record<string, any> = {
    offset,
    limit,
    orderBy: sortConfig.field,
    orderDirection: sortConfig.direction,
  };
  
  // Add search term if provided
  if (searchTerm) {
    params.search = searchTerm;
  }
  
  // Add all non-empty filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params[key] = value;
    }
  });
  
  return apiClient.get('/malfunctions', params);
};

// Function to fetch a single malfunction by id
const fetchMalfunction = async (id: string): Promise<Malfunction> => {
  return apiClient.get(`/malfunctions/${id}`);
};

// Function to fetch malfunction statistics
const fetchMalfunctionStats = async (): Promise<MalfunctionStatsResponse> => {
  return apiClient.get('/malfunctions/stats');
};

// Function to update a malfunction
const updateMalfunction = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Malfunction>;
}): Promise<Malfunction> => {
  return apiClient.put(`/malfunctions/${id}`, data);
};

// Function to upload attachment
const uploadMalfunctionAttachment = async ({
  id,
  fieldType,
  files,
}: {
  id: string;
  fieldType: string;
  files: File[];
}): Promise<{ success: boolean }> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('fieldType', fieldType);
  
  return apiClient.post(`/malfunctions/${id}/attachments`, formData);
};

// Function to delete attachment
const deleteMalfunctionAttachment = async ({
  id,
  attachmentId,
  fieldType,
}: {
  id: string;
  attachmentId: string;
  fieldType: string;
}): Promise<{ success: boolean }> => {
  return apiClient.delete(`/malfunctions/${id}/attachments/${attachmentId}?fieldType=${fieldType}`);
};

// Hook to get malfunctions list
export const useMalfunctions = (
  page: number,
  limit: number,
  searchTerm: string,
  filters: Filters,
  sortConfig: SortConfig
) => {
  return useQuery({
    queryKey: ['malfunctions', page, limit, searchTerm, filters, sortConfig],
    queryFn: () => fetchMalfunctions(page, limit, searchTerm, filters, sortConfig),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: undefined, // Placeholder data while fetching new data
  });
};

// Hook to get a single malfunction
export const useMalfunction = (id: string) => {
  return useQuery({
    queryKey: ['malfunction', id],
    queryFn: () => fetchMalfunction(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
};

// Hook to get malfunction statistics
export const useMalfunctionsStats = () => {
  return useQuery({
    queryKey: ['malfunctions-stats'],
    queryFn: fetchMalfunctionStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to update a malfunction
export const useUpdateMalfunction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMalfunction,
    onSuccess: (data) => {
      // Invalidate and refetch the specific malfunction
      queryClient.invalidateQueries({ queryKey: ['malfunction', data.id] });
      
      // Also invalidate the malfunctions list
      queryClient.invalidateQueries({ queryKey: ['malfunctions'] });
      
      // And optionally the stats
      queryClient.invalidateQueries({ queryKey: ['malfunctions-stats'] });
    },
  });
};

// Hook to upload attachment
export const useUploadMalfunctionAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadMalfunctionAttachment,
    onSuccess: (_, variables) => {
      // Invalidate the specific malfunction to refresh attachments
      queryClient.invalidateQueries({ queryKey: ['malfunction', variables.id] });
    },
  });
};

// Hook to delete attachment
export const useDeleteMalfunctionAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMalfunctionAttachment,
    onSuccess: (_, variables) => {
      // Invalidate the specific malfunction to refresh attachments
      queryClient.invalidateQueries({ queryKey: ['malfunction', variables.id] });
    },
  });
};