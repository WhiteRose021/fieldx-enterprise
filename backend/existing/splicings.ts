import { api } from "encore.dev/api";
import { getClient } from "./client";
import { EntityQueryParams, convertQueryParams } from "./entities";
import { RedisService } from "../core/redis";
import { Logger } from "../core/logger";

// Initialize Redis service
const redis = RedisService.getInstance();

// Cache keys and TTL
const CACHE_KEY_LIST = 'splicing:list';
const CACHE_KEY_DETAIL = (id: string) => `splicing:${id}`;
const CACHE_TTL = 300; // 5 minutes

// Define interface for Splicing entity
export interface SplicingWork {
  id: string;
  name: string;
  sr: string;
  status?: string;
  clientName?: string;
  customerMobile?: string;
  customerEmail?: string;
  mapsurl?: string;
  description?: string;
  pilotFloor?: number;
  floors?: number;
  createdAt: string;
  modifiedAt: string;
  createdById: string;
  createdByName: string;
  modifiedById?: string;
  modifiedByName?: string;
  assignedUserId?: string;
  assignedUserName?: string;

  // Add more fields as needed from the metadata list
}

export interface SplicingListResponse {
  list: SplicingWork[];
  total: number;
}

export interface CreateSplicingRequest {
  name: string;
  sr: string;
  clientName?: string;
  customerMobile?: string;
  status?: string;
  description?: string;
}

export interface UpdateSplicingRequest {
  id: string;
  data: Partial<CreateSplicingRequest>;
}

// Fetch list of splicing records
export const getSplicingList = api(
  { expose: true, method: "GET", path: "/splicings" },
  async (params: EntityQueryParams): Promise<SplicingListResponse> => {
    Logger.info("Fetching Splicing list with params:", params);
    try {
      if (Object.keys(params).length === 0) {
        const cached = await redis.get<SplicingListResponse>(CACHE_KEY_LIST);
        if (cached) {
          Logger.info("Using cached Splicing list");
          return cached;
        }
      }

      const client = getClient();
      const formattedParams = convertQueryParams(params);
      const response = await client.request("GET", "CSplicingWork", formattedParams);

      if (Object.keys(params).length === 0) {
        await redis.set(CACHE_KEY_LIST, response, CACHE_TTL);
      }

      return response;
    } catch (error) {
      Logger.error("Error fetching Splicing list:", error as Record<string, any>);
      throw error;
    }
  }
);

// Fetch detail for a specific splicing record
export const getSplicingDetail = api(
  { expose: true, method: "GET", path: "/splicings/:id" },
  async ({ id }: { id: string }): Promise<SplicingWork> => {
    Logger.info(`Fetching Splicing detail for ID: ${id}`);
    try {
      const cached = await redis.get<SplicingWork>(CACHE_KEY_DETAIL(id));
      if (cached) {
        Logger.info(`Using cached Splicing detail for ID: ${id}`);
        return cached;
      }

      const client = getClient();
      const response = await client.request("GET", `CSplicingWork/${id}`);

      await redis.set(CACHE_KEY_DETAIL(id), response, CACHE_TTL);
      return response;
    } catch (error) {
      Logger.error(`Error fetching Splicing ${id}:`, error as Record<string, any>);
      throw error;
    }
  }
);

// Create a new splicing record
export const createSplicing = api(
  { expose: true, method: "POST", path: "/splicings" },
  async (data: CreateSplicingRequest): Promise<SplicingWork> => {
    Logger.info("Creating Splicing record:", data);
    try {
      const client = getClient();
      const sanitized = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      const response = await client.request("POST", "CSplicingWork", sanitized);
      await redis.delete(CACHE_KEY_LIST);
      return response;
    } catch (error) {
      Logger.error("Error creating Splicing record:", error as Record<string, any>);
      throw error;
    }
  }
);

// Update a splicing record
export const updateSplicing = api(
  { expose: true, method: "PUT", path: "/splicings/:id" },
  async ({ id, data }: UpdateSplicingRequest): Promise<SplicingWork> => {
    Logger.info(`Updating Splicing record ${id}`);
    try {
      const client = getClient();
      const sanitized = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && k !== 'id'));
      const response = await client.request("PUT", `CSplicingWork/${id}`, sanitized);

      await redis.delete(CACHE_KEY_DETAIL(id));
      await redis.delete(CACHE_KEY_LIST);
      return response;
    } catch (error) {
      Logger.error(`Error updating Splicing record ${id}:`, error as Record<string, any>);
      throw error;
    }
  }
);

// Delete a splicing record
export const deleteSplicing = api(
  { expose: true, method: "DELETE", path: "/splicings/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    Logger.info(`Deleting Splicing record ${id}`);
    try {
      const client = getClient();
      await client.request("DELETE", `CSplicingWork/${id}`);
      await redis.delete(CACHE_KEY_DETAIL(id));
      await redis.delete(CACHE_KEY_LIST);
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting Splicing record ${id}:`, error as Record<string, any>);
      throw error;
    }
  }
);
