// services/existing/entities.ts
import { espoCRMConfig } from "./config";

// Base Entity interface - completely without any index signature
export interface Entity {
  id: string;
  name: string;
  deleted?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  createdById?: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  // Removed teamsIds, teamsNames, followersIds, followersNames as they may cause issues
}

// For cases where we need to handle teams and followers separately
export interface EntityTeams {
  teamsIds: string[];
  teamsNames: Record<string, string>;
}

export interface EntityFollowers {
  isFollowed: boolean;
  followersIds: string[];
  followersNames: Record<string, string>;
}

// Generic response for list endpoints
export interface EntityListResponse {
  list: Record<string, any>[];
  total: number;
  offset?: number;
  maxSize?: number;
}

// Type guard to check if an object conforms to the Entity interface
export function isEntity(obj: any): obj is Entity {
  return obj && 
    typeof obj === 'object' && 
    'id' in obj && 
    'name' in obj;
}

// Map of entity types to their singular and plural names for URL construction
export const ENTITY_TYPES: Record<string, { singular: string, plural: string }> = {
  User: { singular: 'User', plural: 'Users' },
  Account: { singular: 'Account', plural: 'Accounts' },
  Contact: { singular: 'Contact', plural: 'Contacts' },
  Lead: { singular: 'Lead', plural: 'Leads' },
  Opportunity: { singular: 'Opportunity', plural: 'Opportunities' },
  Case: { singular: 'Case', plural: 'Cases' },
  Meeting: { singular: 'Meeting', plural: 'Meetings' },
  Call: { singular: 'Call', plural: 'Calls' },
  Task: { singular: 'Task', plural: 'Tasks' },
  Email: { singular: 'Email', plural: 'Emails' },
  Campaign: { singular: 'Campaign', plural: 'Campaigns' },
  Document: { singular: 'Document', plural: 'Documents' },
  Team: { singular: 'Team', plural: 'Teams' },
  Aytopsies1: { singular: 'Aytopsies1', plural: 'Aytopsies1List' },
};

// Generic type for entity query parameters
export interface EntityQueryParams {
  select?: string | string[];
  where?: any[];
  offset?: number;
  maxSize?: number;
  sortBy?: string;
  asc?: boolean;
  textFilter?: string;
  primaryFilter?: string;
  boolFilterList?: string[];
}

// Create a normalized entity name for consistent usage
export function normalizeEntityName(entityType: string): string {
  return ENTITY_TYPES[entityType]?.singular || entityType;
}

// Get the API path for a specific entity type
export function getEntityPath(entityType: string): string {
  return ENTITY_TYPES[entityType]?.plural || `${entityType}s`;
}

// Convert entity query parameters to URL parameters
export function convertQueryParams(params: EntityQueryParams): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (params.select) {
    result.select = Array.isArray(params.select) ? params.select.join(',') : params.select;
  }
  
  if (params.where) {
    result.where = JSON.stringify(params.where);
  }
  
  if (params.offset !== undefined) {
    result.offset = params.offset;
  }
  
  if (params.maxSize !== undefined) {
    result.maxSize = params.maxSize;
  }
  
  if (params.sortBy) {
    result.sortBy = params.sortBy;
    if (params.asc !== undefined) {
      result.asc = params.asc ? 'true' : 'false';
    }
  }
  
  if (params.textFilter) {
    result.textFilter = params.textFilter;
  }
  
  if (params.primaryFilter) {
    result.primaryFilter = params.primaryFilter;
  }
  
  if (params.boolFilterList) {
    result.boolFilterList = JSON.stringify(params.boolFilterList);
  }
  
  return result;
}

// User Entity
export interface UserBasicInfo {
  id: string;
  name: string;
  userName: string;
  emailAddress: string;
  isAdmin: boolean;
  isActive: boolean;
}

// Autopsy Basic Info
export interface AutopsyBasicInfo {
  id: string;
  name: string;
  status: string;
  customerName: string;
  orderNumber: string;
}

// Helper functions for type checking specific entity types at runtime
export function isUserEntity(obj: any): obj is UserBasicInfo {
  return isEntity(obj) && 'userName' in obj && 'emailAddress' in obj;
}

export function isAutopsyEntity(obj: any): obj is AutopsyBasicInfo {
  return isEntity(obj) && 'customerName' in obj && 'status' in obj;
}