// services/existing/api.ts - Updated to use user-specific authentication

import { api } from "encore.dev/api";
import { getClient, getUserClient } from "./client";
import { EntityQueryParams, convertQueryParams } from "./entities";
import { Logger } from "../core/logger";
import { AuthService } from "../core/auth";

// Define proper interfaces for API return types
export interface AutopsyEntity {
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
  aGETEST: number;
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
  serviceidId: string | null;
  serviceidType: string | null;
  cKtiria1Id: string | null;
  cKtiria1Name: string | null;
}

export interface AutopsiesListResponse {
  list: AutopsyEntity[];
  total: number;
}

// Define specific types for create and update operations
export interface CreateAutopsyRequest {
  name?: string;
  status?: string;
  pilot?: string;
  orderNumber?: string;
  cATEGORY?: string;
  fLOOR?: string;
  aK?: string;
  customerName?: string;
  customerMobile?: string;
  custonerNumber?: string | null;
  customerEmail?: string;
  adminName?: string;
  adminMobile?: string;
  adminNumber?: string;
  adminEmail?: string;
  bUILDINGID?: string;
  tTLP?: string;
  cAB?: string;
  cABAddress?: string;
  aGETEST?: number;
  finalBuilding?: string;
  aDDRESSCountry?: string;
  sxolia?: string | null;
  latitude?: string;
  longitude?: string;
  akmul?: string | null;
  ekswsysthmikh?: string | null;
  aDDRESSPostalCode?: string | null;
  demo?: string;
  aDDRESSStreet?: string;
  aDDRESSCity?: string;
  req?: {
    headers?: {
      authorization?: string;
    };
  };
}

export interface UpdateAutopsyRequest {
  id: string;
  data: CreateAutopsyRequest;
  req?: {
    headers?: {
      authorization?: string;
    };
  };
}

// Helper to extract user ID from authorization header
async function getUserIdFromRequest(req: any): Promise<string | undefined> {
  const authHeader = req?.headers?.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    Logger.debug("No auth header in request");
    return undefined;
  }

  const token = authHeader.substring(7);
  try {
    const authService = AuthService.getInstance();
    const { user } = await authService.verifyToken(token);
    Logger.debug(`Extracted user ID from auth header: ${user.id}`);
    return user.id;
  } catch (error) {
    Logger.error("Error extracting user ID from auth header", { error });
    return undefined;
  }
}

// Direct API proxy with user authentication support
export const getAutopsiesList = api(
  { expose: true, method: "GET", path: "/autopsies" },
  async (params: EntityQueryParams & { req?: any }): Promise<AutopsiesListResponse> => {
    Logger.info("Fetching autopsies with params:", { params });
    
    try {
      // Get user ID from request if available
      const userId = await getUserIdFromRequest(params.req);
      
      // Get the EspoCRM client - use user-specific client if available
      const client = userId ? getUserClient(userId) : getClient();
      
      // Log to see what's happening
      Logger.info("Client created successfully", { usingUserAuth: !!userId });
      
      // Convert query parameters to the format EspoCRM expects
      const formattedParams = convertQueryParams(params);
      Logger.debug("Formatted params:", { formattedParams });
      
      // Make request to EspoCRM - direct use of "Aytopsies1" entity name
      Logger.info("Making request to EspoCRM", { asUser: userId || 'API key' });
      const response = await client.request("GET", "Aytopsies1", formattedParams);
      Logger.info("Got response from EspoCRM");
      
      return response;
    } catch (error) {
      // Enhanced error logging
      Logger.error("Error fetching autopsies list:", { error });
      
      // More detailed error info
      if (error instanceof Error) {
        Logger.error("Error details:", { 
          name: error.name,
          message: error.message,
          stack: error.stack 
        });
      }
      
      throw error;
    }
  }
);

// Get a single autopsy by ID - updated to use user-specific client
export const getAutopsyDetail = api(
  { expose: true, method: "GET", path: "/autopsies/:id" },
  async ({ id, req }: { id: string, req?: any }): Promise<AutopsyEntity> => {
    Logger.info(`Fetching autopsy details for ID: ${id}`);
    
    try {
      // Get user ID from request if available
      const userId = await getUserIdFromRequest(req);
      
      // Get the EspoCRM client - use user-specific client if available
      const client = userId ? getUserClient(userId) : getClient();
      Logger.info("Client created successfully", { usingUserAuth: !!userId });
      
      // Make request to EspoCRM - direct use of "Aytopsies1" entity name
      Logger.info(`Making request to EspoCRM for Aytopsies1/${id}`, { asUser: userId || 'API key' });
      const response = await client.request("GET", `Aytopsies1/${id}`);
      Logger.info("Got response from EspoCRM");
      
      return response;
    } catch (error) {
      // Enhanced error logging
      Logger.error(`Error fetching autopsy ${id}:`, { error });
      
      // More detailed error info
      if (error instanceof Error) {
        Logger.error("Error details:", { 
          name: error.name,
          message: error.message,
          stack: error.stack 
        });
      }
      
      throw error;
    }
  }
);

// Create a new autopsy - updated to use user-specific client
export const createAutopsy = api(
  { expose: true, method: "POST", path: "/autopsies" },
  async (data: CreateAutopsyRequest): Promise<AutopsyEntity> => {
    Logger.info("Creating new autopsy with data:", { data: JSON.stringify(data) });
    
    try {
      // Get user ID from request if available
      const userId = await getUserIdFromRequest(data.req);
      
      // Get the EspoCRM client - use user-specific client if available
      const client = userId ? getUserClient(userId) : getClient();
      Logger.info("Client created successfully", { usingUserAuth: !!userId });
      
      // Create a clean version of the data without request info
      const cleanData = { ...data };
      delete (cleanData as any).req;
      
      // Remove undefined values
      const sanitizedData = Object.fromEntries(
        Object.entries(cleanData).filter(([_, v]) => v !== undefined)
      );
      
      // Make request to EspoCRM
      Logger.info("Making POST request to EspoCRM for Aytopsies1", { asUser: userId || 'API key' });
      const response = await client.request("POST", "Aytopsies1", sanitizedData);
      Logger.info("Successfully created new autopsy");
      
      return response;
    } catch (error) {
      // Enhanced error logging
      Logger.error("Error creating autopsy:", { error });
      
      // More detailed error info
      if (error instanceof Error) {
        Logger.error("Error details:", { 
          name: error.name,
          message: error.message,
          stack: error.stack 
        });
      }
      
      throw error;
    }
  }
);

// Update an autopsy - updated to use user-specific client
export const updateAutopsy = api(
  { expose: true, method: "PUT", path: "/autopsies/:id" },
  async ({ id, data, req }: UpdateAutopsyRequest): Promise<AutopsyEntity> => {
    Logger.info(`Updating autopsy with ID: ${id}`);
    
    try {
      // Get user ID from request if available
      const userId = await getUserIdFromRequest(req || data.req);
      
      // Get the EspoCRM client - use user-specific client if available
      const client = userId ? getUserClient(userId) : getClient();
      Logger.info("Client created successfully", { usingUserAuth: !!userId });
      
      // Create a clean version of the data without request info
      const cleanData = { ...data };
      delete (cleanData as any).req;
      
      // Sanitize the input data
      // 1. Remove undefined values
      // 2. Remove id field if present (can't be changed)
      const sanitizedData = Object.fromEntries(
        Object.entries(cleanData || {}).filter(([key, value]) => 
          value !== undefined && key !== 'id'
        )
      );
      
      Logger.debug(`Sanitized data for update:`, { sanitizedData });
      
      // Make request to EspoCRM
      Logger.info(`Making PUT request to EspoCRM for Aytopsies1/${id}`, { asUser: userId || 'API key' });
      const response = await client.request("PUT", `Aytopsies1/${id}`, sanitizedData);
      Logger.info(`Successfully updated autopsy ${id}`);
      
      return response;
    } catch (error) {
      Logger.error(`Error updating autopsy ${id}:`, { error });
      
      // More detailed error info
      if (error instanceof Error) {
        Logger.error("Error details:", { 
          name: error.name,
          message: error.message,
          stack: error.stack 
        });
      }
      
      throw error;
    }
  }
);

// Delete an autopsy - updated to use user-specific client
export const deleteAutopsy = api(
  { expose: true, method: "DELETE", path: "/autopsies/:id" },
  async ({ id, req }: { id: string, req?: any }): Promise<{ success: boolean }> => {
    Logger.info(`Deleting autopsy with ID: ${id}`);
    
    try {
      // Get user ID from request if available
      const userId = await getUserIdFromRequest(req);
      
      // Get the EspoCRM client - use user-specific client if available
      const client = userId ? getUserClient(userId) : getClient();
      Logger.info("Client created successfully", { usingUserAuth: !!userId });
      
      // Make request to EspoCRM
      Logger.info(`Making DELETE request to EspoCRM for Aytopsies1/${id}`, { asUser: userId || 'API key' });
      await client.request("DELETE", `Aytopsies1/${id}`);
      Logger.info(`Successfully deleted autopsy ${id}`);
      
      return { success: true };
    } catch (error) {
      // Enhanced error logging
      Logger.error(`Error deleting autopsy ${id}:`, { error });
      
      // More detailed error info
      if (error instanceof Error) {
        Logger.error("Error details:", { 
          name: error.name,
          message: error.message,
          stack: error.stack 
        });
      }
      
      throw error;
    }
  }
);