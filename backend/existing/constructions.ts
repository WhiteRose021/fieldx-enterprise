// services/existing/constructions.ts
import { api } from "encore.dev/api";
import { getClient } from "./client";
import { EntityQueryParams, convertQueryParams } from "./entities";
import { RedisService } from "../core/redis";
import { Logger } from "../core/logger";

// Initialize Redis service
const redis = RedisService.getInstance();

// Cache keys and TTL
const CACHE_KEY_LIST = 'constructions:list';
const CACHE_KEY_DETAIL = (id: string) => `constructions:${id}`;
const CACHE_TTL = 300; // 5 minutes

// Define interface for Construction entity
export interface Construction {
  id: string;
  name: string;
  deleted: boolean;
  // Add all the specific fields of KataskeyesBFasi here

  address?: string;
  status?: string;
  orderNumber?: string;

  // Common fields
  createdAt: string;
  modifiedAt: string;
  createdById: string;
  createdByName: string;
  modifiedById: string;
  modifiedByName: string;
  assignedUserId?: string;
  assignedUserName?: string;
}

export interface ConstructionsListResponse {
  list: Construction[];
  total: number;
}

// Create/update types
export interface CreateConstructionRequest {
  name?: string;
  address?: string;
  status?: string;
  orderNumber?: string;
  // Add all fields that can be created/updated
}

export interface UpdateConstructionRequest {
  id: string;
  data: Partial<CreateConstructionRequest>;
}


// Get list of Constructions
export const getConstructionsList = api(
  { expose: true, method: "GET", path: "/constructions" },
  async (params: EntityQueryParams): Promise<ConstructionsListResponse> => {
    Logger.info("Fetching Constructions list with params:", params);
    
    try {
      // Try to get from cache if no filters
      if (Object.keys(params).length === 0) {
        const cached = await redis.get<ConstructionsListResponse>(CACHE_KEY_LIST);
        if (cached) {
          Logger.info("Using cached Constructions list");
          return cached;
        }
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Convert query parameters
      const formattedParams = convertQueryParams(params);
      Logger.info("Formatted params:", formattedParams);
      
      // Make request to EspoCRM - use actual entity name "KataskeyesBFasi"
      Logger.info("Making request to EspoCRM for KataskeyesBFasi");
      const response = await client.request("GET", "KataskeyesBFasi", formattedParams);
      
      // Cache if no filters
      if (Object.keys(params).length === 0) {
        await redis.set(CACHE_KEY_LIST, response, CACHE_TTL);
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("Error fetching Constructions list:", { message: error.message, stack: error.stack });
      } else {
        Logger.error("Error fetching Constructions list:", { error });
      }
      throw error;
    }
  }
);

// Get a single Construction by ID
export const getConstructionDetail = api(
  { expose: true, method: "GET", path: "/constructions/:id" },
  async ({ id }: { id: string }): Promise<Construction> => {
    Logger.info(`Fetching Construction details for ID: ${id}`);
    
    try {
      // Try to get from cache first
      const cached = await redis.get<Construction>(CACHE_KEY_DETAIL(id));
      if (cached) {
        Logger.info(`Using cached Construction details for ID: ${id}`);
        return cached;
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM - use actual entity name "KataskeyesBFasi"
      Logger.info(`Making request to EspoCRM for KataskeyesBFasi/${id}`);
      const response = await client.request("GET", `KataskeyesBFasi/${id}`);
      
      // Cache the result
      await redis.set(CACHE_KEY_DETAIL(id), response, CACHE_TTL);
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error fetching Construction ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error fetching Construction ${id}:`, { error });
      }
      throw error;
    }
  }
);

// Create a new Construction
export const createConstruction = api(
  { expose: true, method: "POST", path: "/constructions" },
  async (data: CreateConstructionRequest): Promise<Construction> => {
    Logger.info("Creating new Construction with data:", { data: JSON.stringify(data) });
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Remove undefined values
      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      // Make request to EspoCRM - use actual entity name "KataskeyesBFasi"
      Logger.info("Making POST request to EspoCRM for KataskeyesBFasi");
      const response = await client.request("POST", "KataskeyesBFasi", sanitizedData);
      Logger.info("Successfully created new Construction");
      
      // Invalidate cache
      await redis.delete(CACHE_KEY_LIST);
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("Error creating Construction:", { message: error.message, stack: error.stack });
      } else {
        Logger.error("Error creating Construction:", { error });
      }
      throw error;
    }
  }
);

// Update an existing Construction
export const updateConstruction = api(
  { expose: true, method: "PUT", path: "/constructions/:id" },
  async ({ id, data }: UpdateConstructionRequest): Promise<Construction> => {
    Logger.info(`Updating Construction with ID: ${id}`);
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Sanitize the input data
      const sanitizedData = Object.fromEntries(
        Object.entries(data || {}).filter(([key, value]) => 
          value !== undefined && key !== 'id'
        )
      );
      
      Logger.info(`Sanitized data for update:`, sanitizedData);
      
      // Make request to EspoCRM - use actual entity name "KataskeyesBFasi"
      const response = await client.request("PUT", `KataskeyesBFasi/${id}`, sanitizedData);
      Logger.info(`Successfully updated Construction ${id}`);
      
      // Invalidate caches
      await redis.delete(CACHE_KEY_DETAIL(id));
      await redis.delete(CACHE_KEY_LIST);
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error updating Construction ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error updating Construction ${id}:`, { error });
      }
      throw error;
    }
  }
);

// Delete a Construction
export const deleteConstruction = api(
  { expose: true, method: "DELETE", path: "/constructions/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    Logger.info(`Deleting Construction with ID: ${id}`);
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM - use actual entity name "KataskeyesBFasi"
      await client.request("DELETE", `KataskeyesBFasi/${id}`);
      Logger.info(`Successfully deleted Construction ${id}`);
      
      // Invalidate caches
      await redis.delete(CACHE_KEY_DETAIL(id));
      await redis.delete(CACHE_KEY_LIST);
      
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error deleting Construction ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error deleting Construction ${id}:`, { error });
      }
      throw error;
    }
  }
);