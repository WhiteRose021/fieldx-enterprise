// services/existing/users.ts
import { api } from "encore.dev/api";
import { getClient } from "./client";
import { convertQueryParams } from "./entities";
import { RedisService } from "../core/redis";
import { Logger } from "../core/logger";

// Define specific types without index signatures
interface WhereClause {
  type: string;
  attribute: string;
  value: any;
}

// Base interface without index signature for function parameters
export interface EntityQueryParamsBase {
  where?: WhereClause[];
  offset?: number;
  maxSize?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  select?: string[];
}

// Extended type with index signature for internal use
export type EntityQueryParams = EntityQueryParamsBase;

// Initialize RedisService
const redis = RedisService.getInstance();

// Cache keys and TTL
const USERS_CACHE_KEY = 'users:list';
const USER_DETAIL_CACHE_KEY = (id: string) => `users:${id}`;
const TECHNICIANS_CACHE_KEY = 'users:technicians';
const CACHE_TTL = 30 * 60; // 30 minutes - users don't change often

// Define proper interfaces for API return types (required by Encore)
export interface UserEntity {
  id: string;
  name: string;
  deleted: boolean;
  userName: string;
  type: string;
  authMethod: string | null;
  apiKey: string | null;
  salutationName: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  title: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  gender: string | null;
  createdAt: string;
  modifiedAt: string;
  auth2FA: string | null;
  lastAccess: string | null;
  middleName: string | null;
  emailAddressIsOptedOut: boolean | null;
  emailAddressIsInvalid: boolean | null;
  phoneNumberIsOptedOut: boolean | null;
  phoneNumberIsInvalid: boolean | null;
  emailAddressData: any[];
  phoneNumberData: any[];
  defaultTeamId: string | null;
  defaultTeamName: string | null;
  teamsIds: string[];
  teamsNames: Record<string, string>;
  teamsColumns: Record<string, { role: string | null }>;
  rolesIds: string[];
  rolesNames: Record<string, string>;
  portalsIds: string[];
  portalsNames: Record<string, string>;
  portalRolesIds: string[];
  portalRolesNames: Record<string, string>;
  contactId: string | null;
  contactName: string | null;
  accountsIds: string[];
  accountsNames: Record<string, string>;
  avatarId: string | null;
  avatarName: string | null;
  createdById: string;
  createdByName: string;
  dashboardTemplateId: string | null;
  dashboardTemplateName: string | null;
  workingTimeCalendarId: string | null;
  workingTimeCalendarName: string | null;
  layoutSetId: string | null;
  layoutSetName: string | null;
  ticketIds: string[];
  ticketNames: Record<string, string>;
  [key: string]: any;
}

export interface UsersListResponse {
  list: UserEntity[];
  total: number;
}

// Define specific types for create and update operations without index signatures
export interface CreateUserRequestBase {
  userName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  password?: string;
  passwordConfirm?: string;
  type?: string;
  isActive?: boolean;
  title?: string;
  phoneNumber?: string;
  gender?: string;
  teamsIds?: string[];
  rolesIds?: string[];
  defaultTeamId?: string;
}

// Extended type with index signature for internal use
export type CreateUserRequest = CreateUserRequestBase & Record<string, any>;

export interface UpdateUserRequestBase {
  id: string;
  data: Partial<CreateUserRequestBase>;
}

// Extended type with index signature for internal use
export type UpdateUserRequest = {
  id: string;
  data: Partial<CreateUserRequest>;
}

// Define ApiError class for consistent error handling
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// Helper function to check if a user is a technician
export function isTechnician(user: UserEntity): boolean {
  // Check if user belongs to any team with "Technicians" in the name
  const isInTechniciansTeam = Object.values(user.teamsNames || {}).some(
    teamName => teamName?.toLowerCase().includes('technician')
  );
  
  // Check if user is active
  const isActive = user.isActive === true;
  
  // Combine criteria - must be active and in a technicians team
  return isActive && isInTechniciansTeam;
}

// Get all users with optional filtering
export const getUsersList = api(
  { expose: true, method: "GET", path: "/users" },
  async (params: EntityQueryParamsBase) => {
    // Use the base type without index signature
    Logger.info("Fetching users with params:", params);
    
    try {
      // Try to get from cache first if no filters are applied
      if (Object.keys(params).length === 0) {
        const cached = await redis.get<UsersListResponse>(USERS_CACHE_KEY);
        if (cached) {
          Logger.info("Using cached users list");
          return cached;
        }
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Convert query parameters to the format EspoCRM expects
      // Cast to any to bypass TypeScript limitations with index signatures
      const formattedParams = convertQueryParams(params as any);
      
      // Make request to EspoCRM
      Logger.info("Making request to EspoCRM for User list");
      const response = await client.request("GET", "User", formattedParams);
      
      // Cache only if no filters are applied
      if (Object.keys(params).length === 0) {
        await redis.set(USERS_CACHE_KEY, response, CACHE_TTL);
      }
      
      return response as UsersListResponse;
    } catch (error) {
      // Enhanced error logging
      if (error instanceof Error) {
        Logger.error("Error fetching users list:", { message: error.message, stack: error.stack });
      } else {
        Logger.error("Error fetching users list:", { error });
      }
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Get a single user by ID
export const getUserDetail = api(
  { expose: true, method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }) => {
    Logger.info(`Fetching user details for ID: ${id}`);
    
    try {
      // Try to get from cache first
      const cached = await redis.get<UserEntity>(USER_DETAIL_CACHE_KEY(id));
      if (cached) {
        Logger.info(`Using cached user details for ID: ${id}`);
        return cached;
      }
      
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM
      Logger.info(`Making request to EspoCRM for User/${id}`);
      const response = await client.request("GET", `User/${id}`);
      
      // Cache the result
      await redis.set(USER_DETAIL_CACHE_KEY(id), response, CACHE_TTL);
      
      return response as UserEntity;
    } catch (error) {
      // Enhanced error logging
      if (error instanceof Error) {
        Logger.error(`Error fetching user ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error fetching user ${id}:`, { error });
      }
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Create a new user
export const createUser = api(
  { expose: true, method: "POST", path: "/users" },
  async (data: CreateUserRequestBase) => {
    Logger.info("Creating new user with data:", { data: JSON.stringify(data) });
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Validate password fields
      if (data.password && data.password !== data.passwordConfirm) {
        throw new ApiError("Passwords do not match", 400);
      }
      
      // Remove undefined values
      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      // Make request to EspoCRM
      Logger.info("Making POST request to EspoCRM for User");
      const response = await client.request("POST", "User", sanitizedData);
      Logger.info("Successfully created new user");
      
      // Invalidate users list cache and technicians cache
      await redis.delete(USERS_CACHE_KEY);
      await redis.delete(TECHNICIANS_CACHE_KEY);
      
      return response as UserEntity;
    } catch (error) {
      // Enhanced error logging
      if (error instanceof Error) {
        Logger.error("Error creating user:", { message: error.message, stack: error.stack });
      } else {
        Logger.error("Error creating user:", { error });
      }
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Update an existing user
export const updateUser = api(
  { expose: true, method: "PUT", path: "/users/:id" },
  async ({ id, data }: UpdateUserRequestBase) => {
    Logger.info(`Updating user with ID: ${id}`);
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Validate password fields if present
      if (data.password && data.password !== data.passwordConfirm) {
        throw new ApiError("Passwords do not match", 400);
      }
      
      // Sanitize the input data
      const sanitizedData = Object.fromEntries(
        Object.entries(data || {}).filter(([key, value]) => 
          value !== undefined && key !== 'id'
        )
      );
      
      // Make request to EspoCRM
      const response = await client.request("PUT", `User/${id}`, sanitizedData);
      Logger.info(`Successfully updated user ${id}`);
      
      // Invalidate caches
      await redis.delete(USER_DETAIL_CACHE_KEY(id));
      await redis.delete(USERS_CACHE_KEY);
      await redis.delete(TECHNICIANS_CACHE_KEY);
      
      return response as UserEntity;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`Error updating user ${id}:`, { message: error.message, stack: error.stack });
      } else {
        Logger.error(`Error updating user ${id}:`, { error });
      }
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Delete a user
export const deleteUser = api(
  { expose: true, method: "DELETE", path: "/users/:id" },
  async ({ id }: { id: string }) => {
    Logger.info(`Deleting user with ID: ${id}`);
    
    try {
      // Get the EspoCRM client
      const client = getClient();
      
      // Make request to EspoCRM
      await client.request("DELETE", `User/${id}`);
      Logger.info(`Successfully deleted user ${id}`);
      
      // Invalidate caches
      await redis.delete(USER_DETAIL_CACHE_KEY(id));
      await redis.delete(USERS_CACHE_KEY);
      await redis.delete(TECHNICIANS_CACHE_KEY);
      
      return { success: true };
    } catch (error) {
      Logger.error(`Error deleting user ${id}:`, { error });
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Get technicians (a subset of users with specific roles/types)
export const getTechnicians = api(
  { expose: true, method: "GET", path: "/users/technicians" },
  async () => {
    Logger.info("Fetching technicians");
    
    try {
      // Try to get from cache first
      const cached = await redis.get<UsersListResponse>(TECHNICIANS_CACHE_KEY);
      if (cached) {
        Logger.info("Using cached technicians list");
        return cached;
      }
      
      // First get all active users
      const usersResponse = await getUsersList({
        where: [{
          type: 'equals',
          attribute: 'isActive',
          value: true
        }]
      });
      
      // Filter for technicians using the helper function
      const technicians = usersResponse.list.filter(isTechnician);
      
      Logger.info(`Filtered ${technicians.length} technicians from ${usersResponse.list.length} users`);
      
      const response = {
        list: technicians,
        total: technicians.length
      };
      
      // Cache the result
      await redis.set(TECHNICIANS_CACHE_KEY, response, CACHE_TTL);
      
      return response;
    } catch (error) {
      Logger.error("Error fetching technicians:", { error });
      
      if (error instanceof Error) {
        Logger.error("Error name:", { name: error.name });
        Logger.error("Error message:", { message: error.message });
      }
      
      throw error;
    }
  }
);

// Invalidate users cache
export const invalidateUsersCache = api(
  { expose: true, method: "POST", path: "/users/cache/invalidate" },
  async () => {
    try {
      await redis.delete(USERS_CACHE_KEY);
      await redis.delete(TECHNICIANS_CACHE_KEY);
      Logger.info("Users cache invalidated");
      return { success: true };
    } catch (error) {
      Logger.error("Failed to invalidate users cache", { error });
      throw new ApiError("Failed to invalidate users cache", 500);
    }
  }
);