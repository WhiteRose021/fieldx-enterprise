// services/existing/entity-service.ts

import { api } from "encore.dev/api";
import { getClient } from "./client";
import { convertQueryParams } from "./entities";
import { RedisService } from "../core/redis";
import { Logger } from "../core/logger";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Initialize Redis service
const redis = RedisService.getInstance();

// Cache TTL in seconds
const CACHE_TTL = 300; // 5 minutes

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for entity mapping
interface EntityMapping {
  [key: string]: string;
}

// Simple interfaces for API parameters
export interface GetEntityListParams {
  entityType: string;
  where?: string;
  offset?: number;
  maxSize?: number;
  sortBy?: string;
  asc?: boolean;
  textFilter?: string;
  primaryFilter?: string;
  boolFilterList?: string;
  select?: string;
}

export interface GetEntityDetailParams {
  entityType: string;
  id: string;
}

export interface CreateEntityParams {
  entityType: string;
  name?: string;
  description?: string;
  status?: string;
  // Add core fields that most entities have
}

export interface UpdateEntityParams {
  entityType: string;
  id: string;
  name?: string;
  description?: string;
  status?: string;
  // Add core fields that most entities have
}

export interface DeleteEntityParams {
  entityType: string;
  id: string;
}

// Generic entity response types
export interface GenericEntity {
  id: string;
  name: string;
}

export interface EntityListResponse {
  list: GenericEntity[];
  total: number;
}

// Alternative approach to load entity mapping from hardcoded JSON
// This avoids file system issues with ESM modules
const ENTITY_MAP: EntityMapping = {
  "constructions": "KataskeyesBFasi",
  "splicing": "CSplicingWork",
  "autopsies": "Aytopsies1",
  "buildings": "CKtiria",
  "malfunctions": "CVlaves",
  "billing": "CBilling",
  "users": "User",
  "soilwork": "CChomatourgika",
  "soilwork-appointment": "CEarthWork",
  "blowing": "CEmfyshsh",
  "construction-appointment": "CKataskeyastikadates",
  "lastdrop": "KataskeyesFTTH",
  "lastdrop-appointment": "CLastDropDates",
  "master": "CMaster",
  "autopsies-pilot": "CPilotAutopsies",
  "blowing-appointment": "CRantevouEmf",
  "splicing-appointment": "CSplicingdate",
  "tobebuilt": "CTobbs",
  "malfunction-appointment": "CVlavesAppointments",
  "technical-inspection": "Dummy",
  "technical-check": "Texnikoselegxos",
  "autopsy-appointment": "Test"
};

// Helper function to get EspoCRM entity name from our API path
function getEspoCrmEntityName(entityType: string): string {
  const espoCrmEntity = ENTITY_MAP[entityType];
  if (!espoCrmEntity) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return espoCrmEntity;
}

// Helper to build consistent cache keys
function getCacheKey(entityType: string, action: string, id?: string): string {
  if (id) {
    return `entity:${entityType}:${action}:${id}`;
  }
  return `entity:${entityType}:${action}`;
}

// Get list of entities
export const getEntityList = api(
  { expose: true, method: "GET", path: "/:entityType" },
  async function(params: GetEntityListParams): Promise<EntityListResponse> {
    const { entityType, ...queryParams } = params;
    Logger.info(`Fetching ${entityType} list with params:`, queryParams);
    
    try {
      // Get EspoCRM entity name
      const espoCrmEntity = getEspoCrmEntityName(entityType);
      
      // Cache key - for simple requests only
      const cacheKey = getCacheKey(entityType, 'list');
      const useCache = Object.keys(queryParams).length === 0;
      
      // Try to get from cache if request has no parameters
      if (useCache) {
        const cached = await redis.get<EntityListResponse>(cacheKey);
        if (cached) {
          Logger.info(`Using cached ${entityType} list`);
          return cached;
        }
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Process parameters
      let formattedParams: Record<string, any> = {};
      
      // Handle special parameters that need conversion
      if (params.where) {
        try {
          formattedParams.where = JSON.parse(params.where);
        } catch (e) {
          Logger.warn(`Could not parse 'where' parameter: ${params.where}`);
        }
      }
      
      if (params.boolFilterList) {
        try {
          formattedParams.boolFilterList = JSON.parse(params.boolFilterList);
        } catch (e) {
          Logger.warn(`Could not parse 'boolFilterList' parameter: ${params.boolFilterList}`);
        }
      }
      
      // Copy other params directly
      if (params.offset !== undefined) formattedParams.offset = params.offset;
      if (params.maxSize !== undefined) formattedParams.maxSize = params.maxSize;
      if (params.sortBy !== undefined) formattedParams.sortBy = params.sortBy;
      if (params.asc !== undefined) formattedParams.asc = params.asc;
      if (params.textFilter !== undefined) formattedParams.textFilter = params.textFilter;
      if (params.primaryFilter !== undefined) formattedParams.primaryFilter = params.primaryFilter;
      if (params.select !== undefined) formattedParams.select = params.select;
      
      // Make request to EspoCRM
      Logger.info(`Making request to EspoCRM for ${espoCrmEntity}`);
      const response = await client.request("GET", espoCrmEntity, formattedParams);
      
      // Cache if simple request
      if (useCache) {
        await redis.set(cacheKey, response, CACHE_TTL);
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error fetching ${entityType} list:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error fetching ${entityType} list:`, { error });
      }
      throw error;
    }
  }
);

// Get a single entity by ID
export const getEntityDetail = api(
  { expose: true, method: "GET", path: "/:entityType/:id" },
  async function(params: GetEntityDetailParams): Promise<GenericEntity> {
    const { entityType, id } = params;
    Logger.info(`Fetching ${entityType} details for ID: ${id}`);
    
    try {
      // Get EspoCRM entity name
      const espoCrmEntity = getEspoCrmEntityName(entityType);
      
      // Cache key
      const cacheKey = getCacheKey(entityType, 'detail', id);
      
      // Try to get from cache first
      const cached = await redis.get<GenericEntity>(cacheKey);
      if (cached) {
        Logger.info(`Using cached ${entityType} details for ID: ${id}`);
        return cached;
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM
      Logger.info(`Making request to EspoCRM for ${espoCrmEntity}/${id}`);
      const response = await client.request("GET", `${espoCrmEntity}/${id}`);
      
      // Cache the result
      await redis.set(cacheKey, response, CACHE_TTL);
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error fetching ${entityType} ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error fetching ${entityType} ${id}:`, { error });
      }
      throw error;
    }
  }
);

// Create a new entity
export const createEntity = api(
  { expose: true, method: "POST", path: "/:entityType" },
  async function(params: CreateEntityParams): Promise<GenericEntity> {
    const { entityType, ...providedData } = params;
    
    // Extract all properties from the params object
    const data = Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== 'entityType')
    );
    
    Logger.info(`Creating new ${entityType} with data:`, { data: JSON.stringify(data) });
    
    try {
      // Get EspoCRM entity name
      const espoCrmEntity = getEspoCrmEntityName(entityType);
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM
      Logger.info(`Making POST request to EspoCRM for ${espoCrmEntity}`);
      const response = await client.request("POST", espoCrmEntity, data);
      Logger.info(`Successfully created new ${entityType}`);
      
      // Invalidate list cache
      await redis.delete(getCacheKey(entityType, 'list'));
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error creating ${entityType}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error creating ${entityType}:`, { error });
      }
      throw error;
    }
  }
);

// Update an existing entity
export const updateEntity = api(
  { expose: true, method: "PUT", path: "/:entityType/:id" },
  async function(params: UpdateEntityParams): Promise<GenericEntity> {
    const { entityType, id, ...providedData } = params;
    
    // Extract all properties from the params object
    const data = Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== 'entityType' && key !== 'id')
    );
    
    Logger.info(`Updating ${entityType} with ID: ${id}`);
    
    try {
      // Get EspoCRM entity name
      const espoCrmEntity = getEspoCrmEntityName(entityType);
      
      // Get the EspoCRM client
      const client = getClient();
      
      Logger.info(`Data for update:`, data);
      
      // Make request to EspoCRM
      const response = await client.request("PUT", `${espoCrmEntity}/${id}`, data);
      Logger.info(`Successfully updated ${entityType} ${id}`);
      
      // Invalidate caches
      await redis.delete(getCacheKey(entityType, 'detail', id));
      await redis.delete(getCacheKey(entityType, 'list'));
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error updating ${entityType} ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error updating ${entityType} ${id}:`, { error });
      }
      throw error;
    }
  }
);

// Delete an entity
export const deleteEntity = api(
  { expose: true, method: "DELETE", path: "/:entityType/:id" },
  async function(params: DeleteEntityParams): Promise<{ success: boolean }> {
    const { entityType, id } = params;
    Logger.info(`Deleting ${entityType} with ID: ${id}`);
    
    try {
      // Get EspoCRM entity name
      const espoCrmEntity = getEspoCrmEntityName(entityType);
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM
      await client.request("DELETE", `${espoCrmEntity}/${id}`);
      Logger.info(`Successfully deleted ${entityType} ${id}`);
      
      // Invalidate caches
      await redis.delete(getCacheKey(entityType, 'detail', id));
      await redis.delete(getCacheKey(entityType, 'list'));
      
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error deleting ${entityType} ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error deleting ${entityType} ${id}:`, { error });
      }
      throw error;
    }
  }
);