import { api } from "encore.dev/api";
import { getClient } from "./client";
import { convertQueryParams } from "./entities";
import { RedisService } from "../core/redis";
import { Logger } from "../core/logger";

// Initialize Redis service
const redis = RedisService.getInstance();

// Cache keys and TTL
const MALFUNCTIONS_CACHE_KEY = "malfunctions:list";
const MALFUNCTION_DETAIL_CACHE_KEY = (id: string) => `malfunctions:${id}`;
const MALFUNCTIONS_STATS_CACHE_KEY = "malfunctions:stats";
const CACHE_TTL = 5 * 60; // 5 minutes

// Define interfaces for API types
export interface Malfunction {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  modifiedAt: string;
  [key: string]: any;
}

export interface MalfunctionsListResponse {
  list: Malfunction[];
  total: number;
}

export interface MalfunctionsParams {
  offset?: number;
  limit?: number;
  search?: string;
  status?: string;
  ttlp?: string;
  ak?: string;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface MalfunctionsStats {
  total: number;
  completed: number;
  pending: number;
  sent: number;
}

export interface UpdateMalfunctionRequest {
  id: string;
  data: Partial<Malfunction>;
}

export interface CreateMalfunctionRequest {
  name: string;
  status: string;
  [key: string]: any;
}

export interface AttachmentUploadRequest {
  fieldType: string;
  files: any[];
}

// Get a list of malfunctions
export const getMalfunctions = api(
  { expose: true, method: "GET", path: "/malfunctions" },
  async (params: MalfunctionsParams): Promise<MalfunctionsListResponse> => {
    try {
      Logger.info("Fetching malfunctions with params:", params);
      
      // Create cache key based on params
      const cacheKey = `${MALFUNCTIONS_CACHE_KEY}:${JSON.stringify(params)}`;
      
      // Check cache first if no specific search or filters are applied
      if (!params.search && !params.status && !params.ttlp && !params.ak && !params.dateFrom && !params.dateTo) {
        const cached = await redis.get<MalfunctionsListResponse>(cacheKey);
        if (cached) {
          Logger.info("Using cached malfunctions list");
          return cached;
        }
      }
      
      // Build query conditions
      let whereConditions: any[] = [];
      
      if (params.search) {
        whereConditions.push({
          type: "or",
          value: [
            {
              type: "contains",
              attribute: "name",
              value: params.search,
            },
            {
              type: "contains",
              attribute: "idvlavis",
              value: params.search,
            },
            {
              type: "contains",
              attribute: "address",
              value: params.search,
            },
            {
              type: "contains",
              attribute: "customername",
              value: params.search,
            },
          ],
        });
      }
      
      if (params.status) {
        whereConditions.push({
          type: "equals",
          attribute: "status",
          value: params.status,
        });
      }
      
      if (params.ttlp) {
        whereConditions.push({
          type: "equals",
          attribute: "ttlp",
          value: params.ttlp,
        });
      }
      
      if (params.ak) {
        whereConditions.push({
          type: "equals",
          attribute: "ak",
          value: params.ak,
        });
      }
      
      if (params.dateFrom || params.dateTo) {
        const dateConditions = [];
        
        if (params.dateFrom) {
          dateConditions.push({
            type: "greaterThanOrEquals",
            attribute: "datecreated",
            value: params.dateFrom,
          });
        }
        
        if (params.dateTo) {
          const endDate = new Date(params.dateTo);
          endDate.setDate(endDate.getDate() + 1);
          dateConditions.push({
            type: "lessThan",
            attribute: "datecreated",
            value: endDate.toISOString().split("T")[0],
          });
        }
        
        if (dateConditions.length > 1) {
          whereConditions.push({
            type: "and",
            value: dateConditions,
          });
        } else if (dateConditions.length === 1) {
          whereConditions.push(dateConditions[0]);
        }
      }
      
      // Prepare query params for EspoCRM
      const queryParams = {
        where: whereConditions.length > 0 ? whereConditions : undefined,
        offset: params.offset || 0,
        maxSize: params.limit || 10,
        orderBy: params.orderBy || "datecreated",
        asc: params.orderDirection === "asc",
      };
      
      // Get client and make the request
      const client = getClient();
      
      // Make request to EspoCRM - use "CVlaves" entity name
      const response = await client.request(
        "GET", 
        "CVlaves", 
        convertQueryParams(queryParams as any)
      );
      
      // Cache results if it's a standard query
      if (!params.search && !params.status && !params.ttlp && !params.ak && !params.dateFrom && !params.dateTo) {
        await redis.set(cacheKey, response, CACHE_TTL);
      }
      
      return response;
    } catch (error) {
      Logger.error("Error fetching malfunctions list:", error as Record<string, any>);
      throw error;
    }
  }
);

// Get a single malfunction by ID
export const getMalfunction = api(
  { expose: true, method: "GET", path: "/malfunctions/:id" },
  async ({ id }: { id: string }): Promise<Malfunction> => {
    try {
      Logger.info(`Fetching malfunction details for ID: ${id}`);
      
      // Check cache first
      const cached = await redis.get<Malfunction>(MALFUNCTION_DETAIL_CACHE_KEY(id));
      if (cached) {
        Logger.info(`Using cached malfunction details for ID: ${id}`);
        return cached;
      }
      
      // Get client and make the request
      const client = getClient();
      
      // Make request to EspoCRM
      const response = await client.request("GET", `CVlaves/${id}`);
      
      // Cache the result
      await redis.set(MALFUNCTION_DETAIL_CACHE_KEY(id), response, CACHE_TTL);
      
      return response;
    } catch (error) {
      Logger.error(`Error fetching malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Get malfunction statistics
export const getMalfunctionsStats = api(
  { expose: true, method: "GET", path: "/malfunctions/stats" },
  async (): Promise<MalfunctionsStats> => {
    try {
      Logger.info("Fetching malfunctions statistics");
      
      // Check cache first
      const cached = await redis.get<MalfunctionsStats>(MALFUNCTIONS_STATS_CACHE_KEY);
      if (cached) {
        Logger.info("Using cached malfunctions statistics");
        return cached;
      }
      
      // Get all malfunctions to calculate stats
      const client = getClient();
      const response = await client.request("GET", "CVlaves", { maxSize: 0 });
      
      // Get the total count
      const total = response.total || 0;
      
      // Get counts by status
      const completed = await getCountByStatus("ΟΛΟΚΛΗΡΩΣΗ");
      const sent = await getCountByStatus("ΑΠΟΣΤΟΛΗ");
      
      // Calculate pending (NEW + NOT_COMPLETED)
      const new_count = await getCountByStatus("ΝΕΟ");
      const not_completed = await getCountByStatus("ΜΗ ΟΛΟΚΛΗΡΩΣΗ");
      const pending = new_count + not_completed;
      
      const stats: MalfunctionsStats = {
        total,
        completed,
        sent,
        pending,
      };
      
      // Cache the result
      await redis.set(MALFUNCTIONS_STATS_CACHE_KEY, stats, CACHE_TTL);
      
      return stats;
    } catch (error) {
      Logger.error("Error fetching malfunctions statistics:", error);
      throw error;
    }
  }
);

// Helper function to get count by status
async function getCountByStatus(status: string): Promise<number> {
  try {
    const client = getClient();
    const where = [{
      type: "equals",
      attribute: "status",
      value: status,
    }];
    
    const response = await client.request("GET", "CVlaves", { 
      where: JSON.stringify(where),
      maxSize: 0 
    });
    
    return response.total || 0;
  } catch (error) {
    Logger.error(`Error getting count for status ${status}:`, error);
    return 0;
  }
}

// Create a new malfunction
export const createMalfunction = api(
  { expose: true, method: "POST", path: "/malfunctions" },
  async (data: CreateMalfunctionRequest): Promise<Malfunction> => {
    try {
      Logger.info("Creating new malfunction with data:", { data });
      
      // Get client and make the request
      const client = getClient();
      
      // Make request to EspoCRM
      const response = await client.request("POST", "CVlaves", data);
      
      // Invalidate cache
      await redis.delete(MALFUNCTIONS_CACHE_KEY);
      await redis.delete(MALFUNCTIONS_STATS_CACHE_KEY);
      
      return response;
    } catch (error) {
      Logger.error("Error creating malfunction:", error);
      throw error;
    }
  }
);

// Update an existing malfunction
export const updateMalfunction = api(
  { expose: true, method: "PUT", path: "/malfunctions/:id" },
  async ({ id, data }: UpdateMalfunctionRequest): Promise<Malfunction> => {
    try {
      Logger.info(`Updating malfunction with ID: ${id}`, { data });
      
      // Get client and make the request
      const client = getClient();
      
      // Make request to EspoCRM
      const response = await client.request("PUT", `CVlaves/${id}`, data);
      
      // Invalidate cache
      await redis.delete(MALFUNCTION_DETAIL_CACHE_KEY(id));
      await redis.delete(MALFUNCTIONS_CACHE_KEY);
      await redis.delete(MALFUNCTIONS_STATS_CACHE_KEY);
      
      return response;
    } catch (error) {
      Logger.error(`Error updating malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Delete a malfunction
export const deleteMalfunction = api(
  { expose: true, method: "DELETE", path: "/malfunctions/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    try {
      Logger.info(`Deleting malfunction with ID: ${id}`);
      
      // Get client and make the request
      const client = getClient();
      
      // Make request to EspoCRM
      await client.request("DELETE", `CVlaves/${id}`);
      
      // Invalidate cache
      await redis.delete(MALFUNCTION_DETAIL_CACHE_KEY(id));
      await redis.delete(MALFUNCTIONS_CACHE_KEY);
      await redis.delete(MALFUNCTIONS_STATS_CACHE_KEY);
      
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Upload attachments to a malfunction
export const uploadAttachments = api(
  { expose: true, method: "POST", path: "/malfunctions/:id/attachments" },
  async ({ id, fieldType, files }: { id: string } & AttachmentUploadRequest): Promise<{ success: boolean }> => {
    try {
      Logger.info(`Uploading attachments to malfunction ${id}`, { fieldType, fileCount: files.length });
      
      // Get client
      const client = getClient();
      
      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('field', fieldType); // This is important for EspoCRM to know which field to update
        formData.append('parentType', 'CVlaves');
        formData.append('parentId', id);
        
        await client.request("POST", "Attachment", formData);
      }
      
      // Invalidate cache
      await redis.delete(MALFUNCTION_DETAIL_CACHE_KEY(id));
      
      return { success: true };
    } catch (error) {
      Logger.error(`Error uploading attachments to malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Delete an attachment
export const deleteAttachment = api(
  { expose: true, method: "DELETE", path: "/malfunctions/:id/attachments/:attachmentId" },
  async ({ id, attachmentId }: { id: string; attachmentId: string }): Promise<{ success: boolean }> => {
    try {
      Logger.info(`Deleting attachment ${attachmentId} from malfunction ${id}`);
      
      // Get client
      const client = getClient();
      
      // Delete the attachment
      await client.request("DELETE", `Attachment/${attachmentId}`);
      
      // Invalidate cache
      await redis.delete(MALFUNCTION_DETAIL_CACHE_KEY(id));
      
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting attachment ${attachmentId} from malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Get attachments for a malfunction
export const getAttachments = api(
  { expose: true, method: "GET", path: "/malfunctions/:id/attachments" },
  async ({ id }: { id: string }): Promise<{ list: any[] }> => {
    try {
      Logger.info(`Getting attachments for malfunction ${id}`);
      
      // Get client
      const client = getClient();
      
      // Get the malfunction to find all attachment fields
      const malfunction = await client.request("GET", `CVlaves/${id}`);
      
      // Collect all attachment IDs
      const attachments: any[] = [];
      
      // Process photos
      if (malfunction.photosIds?.length > 0) {
        for (const photoId of malfunction.photosIds) {
          try {
            const photo = await client.request("GET", `Attachment/${photoId}`);
            photo.fieldType = "photos";
            attachments.push(photo);
          } catch (error) {
            Logger.warn(`Failed to fetch photo attachment ${photoId}:`, error);
          }
        }
      }
      
      // Process soil photos
      if (malfunction.soilphotosIds?.length > 0) {
        for (const photoId of malfunction.soilphotosIds) {
          try {
            const photo = await client.request("GET", `Attachment/${photoId}`);
            photo.fieldType = "soilphotos";
            attachments.push(photo);
          } catch (error) {
            Logger.warn(`Failed to fetch soil photo attachment ${photoId}:`, error);
          }
        }
      }
      
      // Process PDF attachments
      if (malfunction.pdfattachmentIds?.length > 0) {
        for (const pdfId of malfunction.pdfattachmentIds) {
          try {
            const pdf = await client.request("GET", `Attachment/${pdfId}`);
            pdf.fieldType = "pdfattachment";
            attachments.push(pdf);
          } catch (error) {
            Logger.warn(`Failed to fetch PDF attachment ${pdfId}:`, error);
          }
        }
      }
      
      return { list: attachments };
    } catch (error) {
      Logger.error(`Error getting attachments for malfunction ${id}:`, error);
      throw error;
    }
  }
);

// Get a single attachment
export const getAttachment = api(
  { expose: true, method: "GET", path: "/attachments/:id" },
  async ({ id, download }: { id: string; download?: boolean }): Promise<any> => {
    try {
      Logger.info(`Getting attachment ${id}`);
      
      // Get client
      const client = getClient();
      
      // Get the attachment
      const response = await client.request(
        "GET", 
        `Attachment/${id}${download ? '/download' : ''}`
      );
      
      return response;
    } catch (error) {
      Logger.error(`Error getting attachment ${id}:`, error);
      throw error;
    }
  }
);