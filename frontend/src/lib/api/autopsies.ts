// src/lib/api/autopsies.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";


// Make sure this interface matches exactly what comes from your API
export interface Autopsy {
  id: string;
  name: string;
  deleted: boolean;
  description: string | null;
  createdAt: string;
  modifiedAt: string;
  cATEGORY: string;
  orderNumber: string;
  fLOOR: string;
  aK: string;
  customerName: string;
  customerMobile: string;
  custonerNumber: string | null;
  customerEmail: string;
  adminName: string;
  adminMobile: string;
  adminNumber: string;
  adminEmail: string;
  bUILDINGID: string;
  tTLP: string;
  cAB: string;
  cABAddress: string;
  aGETEST: number | string; // Allow both types
  test: string | null;
  testsignature: string | null;
  finalBuilding: string;
  pilot: string;
  aDDRESSCountry: string;
  textForSearch: string | null;
  updatedAt: string | null;
  status: string;
  sxolia: string | null;
  latitude: string;
  longitude: string;
  akmul: string | null;
  ekswsysthmikh: string | null;
  aDDRESSPostalCode: string | null;
  demo: string;
  aDDRESSStreet: string;
  aDDRESSCity: string;
  aDDRESSState: string | null;
  createdById: string;
  createdByName: string;
  modifiedById: string;
  modifiedByName: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  isFollowed?: boolean;
  followersIds?: string[];
  followersNames?: Record<string, string>;
  serviceidId: string | null;
  serviceidType: string | null;
  cKtiria1Id: string | null;
  cKtiria1Name: string | null;
}

export interface AutopsiesResponse {
  list: Autopsy[];
  total: number;
}

export interface AutopsiesStats {
  total: number;
  completed: number;
  pending: number;
  sent: number;
}

export interface AutopsiesFilters {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  ttlp?: string;
  pilot?: string;
  [key: string]: string | undefined;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

// Type for update mutation input
export interface UpdateAutopsyInput {
  id: string;
  data: Partial<Autopsy>;
}

// Fetch a list of autopsies with pagination, search and filters
export const useAutopsies = (
  page: number = 1,
  limit: number = 20,
  searchTerm: string = "",
  filters: AutopsiesFilters = {},
  sortConfig: SortConfig = { field: "createdAt", direction: "desc" }
) => {
  return useQuery({
    queryKey: ["autopsies", page, limit, searchTerm, filters, sortConfig],
    queryFn: async () => {
      // Ensure we always have a valid sort configuration
      const effectiveSortConfig = {
        field: sortConfig.field || "createdAt",
        direction: sortConfig.direction || "desc"
      };
      
      console.log("Fetching autopsies with sort config:", effectiveSortConfig);

      // Prepare direct query parameters - these will be sent directly in the URL
      const queryParams: Record<string, any> = {
        maxSize: limit,
        offset: (page - 1) * limit,
        sortBy: effectiveSortConfig.field,
        asc: effectiveSortConfig.direction === "asc", // false for desc, true for asc
      };

      // Add search term if provided - this is passed directly as a param
      if (searchTerm) {
        queryParams.textFilter = searchTerm;
      }

      // Build where conditions for more complex filters
      const whereConditions: any[] = [];
      
      // Add filter conditions if provided
      if (filters.status) {
        whereConditions.push({
          type: "equals",
          attribute: "status",
          value: filters.status
        });
      }
      
      if (filters.category) {
        whereConditions.push({
          type: "equals",
          attribute: "cATEGORY", // Note: API uses cATEGORY not category
          value: filters.category
        });
      }
      
      if (filters.ttlp) {
        whereConditions.push({
          type: "equals",
          attribute: "tTLP",
          value: filters.ttlp
        });
      }
      
      if (filters.pilot) {
        whereConditions.push({
          type: "equals",
          attribute: "pilot",
          value: filters.pilot
        });
      }
      
      // Date range filtering
      if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) {
          whereConditions.push({
            type: "greaterOrEquals",
            attribute: "createdAt",
            value: `${filters.dateFrom}T00:00:00`
          });
        }
        
        if (filters.dateTo) {
          whereConditions.push({
            type: "lessOrEquals",
            attribute: "createdAt",
            value: `${filters.dateTo}T23:59:59`
          });
        }
      }
      
      // Only add where parameter if we have conditions
      if (whereConditions.length > 0) {
        queryParams.where = whereConditions;
      }

      console.log("API request parameters:", JSON.stringify(queryParams, null, 2));

      try {
        const response = await apiClient.get("/autopsies", queryParams);
        
        // Debug: Check if the results are indeed sorted as expected
        if (response && response.list && response.list.length > 1) {
          const firstDate = new Date(response.list[0].createdAt).getTime();
          const secondDate = new Date(response.list[1].createdAt).getTime();
          console.log("First record created at:", response.list[0].createdAt);
          console.log("Second record created at:", response.list[1].createdAt);
          console.log("Sort check - newest first:", firstDate >= secondDate ? "✓" : "✗");
        }
        
        return response as AutopsiesResponse;
      } catch (error) {
        console.error("Error fetching autopsies:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch a single autopsy by ID
export const useAutopsy = (id: string) => {
  return useQuery({
    queryKey: ["autopsy", id],
    queryFn: async () => {
      const response = await apiClient.get(`/autopsies/${id}`);
      return response as Autopsy;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id, // Only run if id is provided
  });
};

// Fetch autopsies statistics
export const useAutopsiesStats = () => {
  return useQuery({
    queryKey: ["autopsies-stats"],
    queryFn: async () => {
      // Try to get real stats if available
      try {
        const response = await apiClient.get("/autopsies/stats");
        return response as AutopsiesStats;
      } catch (error) {
        console.warn("Could not fetch real stats, using placeholder:", error);
        // Fallback to placeholder
        return {
          total: 348,
          completed: 217,
          pending: 85,
          sent: 46,
        } as AutopsiesStats;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create a new autopsy
export const createAutopsy = async (autopsy: Partial<Autopsy>): Promise<Autopsy> => {
  const response = await apiClient.post("/autopsies", autopsy);
  return response as Autopsy;
};

// Update an existing autopsy
export const updateAutopsy = async (id: string, autopsy: Partial<Autopsy>): Promise<Autopsy> => {
  // Change from patch to put
  return apiClient.put<Autopsy>(`/autopsies/${id}`, autopsy);
};

// Delete an autopsy
export const deleteAutopsy = async (id: string): Promise<{ success: boolean }> => {
  await apiClient.delete(`/autopsies/${id}`);
  return { success: true };
};

// Hook for creating a new autopsy
export const useCreateAutopsy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Autopsy>) => createAutopsy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopsies'] });
      queryClient.invalidateQueries({ queryKey: ['autopsies-stats'] });
    },
  });
};

export const useUpdateAutopsy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateAutopsyInput) => {
      console.log("Calling update with ID:", id, "and data:", data);
      console.log("API URL:", `/autopsies/${id}`);
      console.log("Request data:", JSON.stringify(data, null, 2));

      try {        
        // To this:
        const response = await apiClient.put<Autopsy>(`/autopsies/${id}`, { data });
        
        console.log("API update response:", response);
        return response;
      } catch (error) {
        console.error("API update error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Update successful, data:", data);
      queryClient.invalidateQueries({ queryKey: ["autopsy", data.id] });
      queryClient.invalidateQueries({ queryKey: ["autopsies"] });
      queryClient.invalidateQueries({ queryKey: ["autopsies-stats"] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
};

// Hook for deleting an autopsy
export const useDeleteAutopsy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteAutopsy(id),
    onSuccess: (_, variables) => {
      // Use the id from variables since the success response doesn't include it
      const id = variables;
      queryClient.invalidateQueries({ queryKey: ['autopsy', id] });
      queryClient.invalidateQueries({ queryKey: ['autopsies'] });
      queryClient.invalidateQueries({ queryKey: ['autopsies-stats'] });
    },
  });
};