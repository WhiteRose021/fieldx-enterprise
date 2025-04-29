// services/existing/operations.ts
import { api } from "encore.dev/api";
import { getClient } from "./client";
import { espoCRMConfig } from "./config";

// Define simplified response interfaces that avoid index signatures
export interface SimpleEntity {
  id: string;
  name: string;
}

export interface EntityResponse {
  entity: SimpleEntity;
}

// Completely simplified to avoid any inheritance issues
export interface EntitiesResponse {
  entities: Record<string, any>[];
}

export interface SearchResponse {
  results: Array<{
    id: string;
    name: string;
    entityType: string;
  }>;
  total: number;
}

// Generic relationship management
export const linkEntities = api(
  { expose: true, method: "POST", path: "/:entityType/:id/links" },
  async ({ 
    entityType, 
    id, 
    link, 
    foreignId 
  }: { 
    entityType: string; 
    id: string; 
    link: string; 
    foreignId: string 
  }): Promise<{ success: boolean }> => {
    const client = getClient();
    await client.request("POST", `${entityType}/${id}/links/${link}`, {
      id: foreignId
    });
    return { success: true };
  }
);

export const unlinkEntities = api(
  { expose: true, method: "DELETE", path: "/:entityType/:id/links" },
  async ({ 
    entityType, 
    id, 
    link, 
    foreignId 
  }: { 
    entityType: string; 
    id: string; 
    link: string; 
    foreignId: string 
  }): Promise<{ success: boolean }> => {
    const client = getClient();
    await client.request("DELETE", `${entityType}/${id}/links/${link}/${foreignId}`);
    return { success: true };
  }
);

// Batch operations
export const createEntities = api(
  { expose: true, method: "POST", path: "/:entityType/batch" },
  async ({ 
    entityType, 
    data 
  }: { 
    entityType: string; 
    data: any[] 
  }): Promise<EntitiesResponse> => {
    const client = getClient();
    const entities: Record<string, any>[] = [];
    
    // EspoCRM might not have batch create, so we simulate it
    for (const item of data) {
      const result = await client.request("POST", entityType, item);
      entities.push(result);
    }
    
    return { entities };
  }
);

// Search functionality
export const searchEntities = api(
  { expose: true, method: "GET", path: "/search" },
  async ({ 
    query, 
    entityTypes, 
    maxSize 
  }: { 
    query: string; 
    entityTypes?: string[]; 
    maxSize?: number 
  }): Promise<SearchResponse> => {
    const client = getClient();
    const response = await client.request("GET", "Search", {
      q: query,
      entityType: entityTypes,
      maxSize: maxSize || 10
    });
    
    return {
      results: response.list || [],
      total: response.total || 0
    };
  }
);