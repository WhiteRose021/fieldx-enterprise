// services/existing/client.ts
import { secret } from "encore.dev/config";
import { Logger } from "../core/logger";
import { RedisService } from "../core/redis";

// Get the API key from secrets
const EspoCRMAPIKey = secret("EspoCRMAPIKey");

// Initialize Redis service for user authentication tokens
const redis = RedisService.getInstance();

// Enhanced client for EspoCRM with optional user authentication
export class EspoCRMClient {
  private url: string;
  private apiKey: string;
  private userId?: string;

  /**
   * Create a new EspoCRM client
   * @param url - The base URL for the EspoCRM API
   * @param apiKey - The API key for authentication (fallback)
   * @param userId - Optional user ID to use their authentication token
   */
  constructor(url: string, apiKey: string, userId?: string) {
    this.url = url.endsWith("/") ? url.slice(0, -1) : url;
    this.apiKey = apiKey;
    this.userId = userId;
    
    // Debug info
    Logger.info("EspoCRMClient created", { 
      url, 
      hasApiKey: !!apiKey,
      forUserId: userId || 'none' 
    });
  }

  /**
   * Make a request to the EspoCRM API
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param action - API endpoint path
   * @param data - Optional data to send
   * @returns Promise with response data
   */
  async request(method: string, action: string, data?: any): Promise<any> {
    // Build full URL for EspoCRM API
    let url = `${this.url}/api/v1/${action}`;
    Logger.debug("EspoCRM request URL:", { url });
    
    // Default to API key authentication
    let headers: Record<string, string> = {
      "X-Api-Key": this.apiKey,
    };
    
    // If a user ID is provided, try to get their EspoCRM auth token
    if (this.userId) {
      try {
        const userAuth = await redis.get<string>(`espo:auth:${this.userId}`);
        if (userAuth) {
          // User authentication found, replace API key with user's auth
          headers = { "Authorization": userAuth };
          Logger.debug("Using user authentication", { userId: this.userId });
        } else {
          Logger.warn("No user authentication found, using API key", { userId: this.userId });
        }
      } catch (error) {
        Logger.error("Error getting user authentication, using API key", { error, userId: this.userId });
      }
    }
    
    let requestBody = undefined;
    let queryString = '';

    // Handle different HTTP methods
    if (method === "GET" && data) {
      // For GET requests with data, build query params
      try {
        const params = new URLSearchParams();
        
        // Add each parameter to the query string
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              params.append(key, JSON.stringify(value));
            } else {
              params.append(key, String(value));
            }
          }
        });
        
        queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        Logger.debug("GET request with query params", { url });
      } catch (error) {
        Logger.error("Error building query params", { error });
        throw error;
      }
    } else if (data && method !== "GET") {
      // For non-GET requests with data, add as JSON body
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(data);
      Logger.debug(`${method} request with body length`, { 
        method, 
        bodyLength: requestBody.length 
      });
    }

    // Log headers without sensitive values
    Logger.debug("Request headers", { 
      headers: Object.keys(headers).reduce((acc, key) => {
        acc[key] = key === 'Authorization' || key === 'X-Api-Key' 
          ? '[REDACTED]' 
          : headers[key];
        return acc;
      }, {} as Record<string, string>)
    });

    try {
      // Make the actual HTTP request
      Logger.debug(`Making ${method} request to ${url}`);
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      Logger.debug(`Response status: ${response.status} ${response.statusText}`);

      // Handle error responses
      if (!response.ok) {
        const errorBody = await response.text();
        Logger.error("EspoCRM API error response", { 
          status: response.status, 
          statusText: response.statusText,
          error: errorBody
        });
        throw new Error(`EspoCRM API error: ${response.status} - ${response.statusText}\nResponse: ${errorBody}`);
      }

      // Parse and return JSON response
      const responseData = await response.json();
      Logger.debug("Response received", { 
        responseSize: JSON.stringify(responseData).length
      });
      return responseData;
    } catch (error) {
      Logger.error("EspoCRM request failed", { error, url, method });
      throw error;
    }
  }

  // ---- Specific methods for common operations ----

  /**
   * Search for users in EspoCRM
   * @param query - Search query
   * @param options - Additional search options
   * @returns List of matching users
   */
  async searchUsers(query: string, options: {
    limit?: number,
    offset?: number,
    filterActive?: boolean
  } = {}): Promise<any[]> {
    const { limit = 10, offset = 0, filterActive = true } = options;
    
    // Create filter for search
    const where: any[] = [
      {
        type: 'or',
        value: [
          {
            type: 'contains',
            attribute: 'name',
            value: query
          },
          {
            type: 'contains',
            attribute: 'userName',
            value: query
          },
          {
            type: 'contains',
            attribute: 'emailAddress', // Note: EspoCRM uses emailAddress, not email
            value: query
          }
        ]
      }
    ];
    
    // Add active filter if requested
    if (filterActive) {
      where.push({
        type: 'equals',
        attribute: 'isActive',
        value: true
      });
    }
    
    // Make the request
    const result = await this.request("GET", "User", {
      where,
      select: 'id,name,userName,emailAddress,type,isActive',
      maxSize: limit,
      offset
    });
    
    return result.list || [];
  }

  /**
   * Get a user by ID
   * @param id - EspoCRM user ID
   * @returns User data
   */
  async getUser(id: string): Promise<any> {
    return this.request("GET", `User/${id}`);
  }

  /**
   * Get current user (only works with user authentication)
   * @returns Current user data
   */
  async getCurrentUser(): Promise<any> {
    return this.request("GET", "User/me");
  }
}

/**
 * Get a client instance with API key authentication
 * @returns EspoCRM client
 */
export function getClient(): EspoCRMClient {
  const apiKey = EspoCRMAPIKey();
  if (!apiKey) {
    Logger.error("EspoCRM API Key is empty or undefined");
    throw new Error("API Key is empty or undefined");
  }
  
  return new EspoCRMClient("http://192.168.4.150:8080", apiKey);
}

/**
 * Get a client instance with user-specific authentication
 * @param userId - ID of the user for authentication
 * @returns EspoCRM client with user authentication
 */
export function getUserClient(userId: string): EspoCRMClient {
  const apiKey = EspoCRMAPIKey();
  if (!apiKey) {
    Logger.error("EspoCRM API Key is empty or undefined");
    throw new Error("API Key is empty or undefined");
  }
  
  // Create a client that will use the user's authentication
  return new EspoCRMClient("http://192.168.4.150:8080", apiKey, userId);
}