// frontend/lib/api-client.ts
import { withAuthHeaders } from './auth-helpers';
import TokenManager from '@/utils/token-management';

interface Entity {
  id: string;
  [key: string]: any;
}

interface ListParams {
  [key: string]: any;
}

interface ListResponse<T> {
  list: T[];
  total: number;
}

// Base API client for frontend
export class ApiClient {
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  private isRefreshing: boolean = false;
  private failedQueue: Array<{ resolve: Function; reject: Function; config: any }> = [];
  
  constructor(baseUrl: string = '/api') {
    // Store the provided base URL or use the default
    this.baseUrl = baseUrl;
    console.log("API Client initialized with baseUrl:", this.baseUrl);
  }

  // Process failed requests queue after token refresh
  private processQueue(error: Error | null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  // Handle token refresh for a failed request
  private async handleTokenRefresh() {
    if (this.isRefreshing) {
      // Return a promise that resolves when the refresh is done
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config: {} });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');

      // Direct fetch to avoid recursive token refresh attempts
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include', // For HTTP-only cookies
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Update tokens in TokenManager
      TokenManager.setRefreshToken(data.refreshToken);
      TokenManager.setAccessToken(data.token);
      
      // Update user session data if available
      if (data.user) {
        const userData = {
          id: data.user.id,
          username: data.user.userName,
          name: data.user.name,
          role: data.user.role,
          isAdmin: data.user.isAdmin,
          loggedInAt: new Date().toISOString(),
          expiresAt: new Date(data.expiresAt).toISOString(),
          token: data.token,
        };
        TokenManager.setUserSession(userData);
      }
      
      this.processQueue(null);
      return true;
    } catch (error) {
      this.processQueue(error instanceof Error ? error : new Error('Token refresh failed'));
      TokenManager.clearAuthData();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Generic request method with token refresh and debugging
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>,
    retryAttempt = 0
  ): Promise<T> {
    // Check if session is expired before making the request
    if (TokenManager.isSessionExpired() && retryAttempt === 0) {
      try {
        await this.handleTokenRefresh();
      } catch (error) {
        // If refresh fails, throw an authentication error
        throw new Error('Authentication required. Please log in again.');
      }
    }

    // Add debugging for authentication
    const userSession = TokenManager.getUserSession();
    const authHeaders = withAuthHeaders();
    
    console.log("API Request:", {
      method,
      path,
      hasToken: !!TokenManager.getAccessToken(),
      authHeaders: JSON.stringify(authHeaders)
    });

    let url = `${this.baseUrl}${path}`;

    // Add query parameters if provided
    if (params) {
      // Handle special case for 'where' condition which needs special serialization for EspoCRM
      const whereParam = params.where;
      
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          if (key === 'where' && Array.isArray(value)) {
            // Properly stringify the 'where' array for EspoCRM - this is critical
            queryParams.append(key, JSON.stringify(value));
          } else if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            // Convert boolean values explicitly to 'true'/'false' strings
            if (typeof value === 'boolean') {
              queryParams.append(key, value ? 'true' : 'false');
            } else {
              queryParams.append(key, String(value));
            }
          }
        }
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...withAuthHeaders(),
      },
      credentials: 'include', // Include cookies for access token
    };

    // Add body for non-GET requests
    if (method !== 'GET' && data !== undefined) {
      options.body = JSON.stringify(data);
    }

    console.log(`Making ${method} request to ${url}`, { 
      params: params ? JSON.stringify(params) : undefined,
      data: data ? '(data present)' : undefined
    });

    try {
      const response = await fetch(url, options);

      // For debugging: log response status
      console.log(`Response status: ${response.status} for ${method} ${url}`);

      // Token expired, try to refresh if this isn't already a retry
      if (response.status === 401 && retryAttempt === 0) {
        console.log("Token expired, refreshing...");
        await this.handleTokenRefresh();
        // Retry the request with fresh token
        return this.request(method, path, data, params, 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} - ${response.statusText}`, errorText);
        throw new Error(`API error: ${response.status} - ${response.statusText}\n${errorText}`);
      }

      // Try to parse response as JSON
      try {
        const responseData = await response.json();
        
        // Debug: Log the first few records if this is a list response
        if (responseData && responseData.list && Array.isArray(responseData.list)) {
          console.log(`Received ${responseData.list.length} records, total: ${responseData.total || 'unknown'}`);
          if (responseData.list.length > 0) {
            console.log(`First record:`, {
              id: responseData.list[0].id,
              createdAt: responseData.list[0].createdAt,
              name: responseData.list[0].name
            });
          }
        }
        
        return responseData;
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error(`Failed to parse API response as JSON: ${e}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('API error: 401') && retryAttempt === 0) {
        // Handle 401 errors that might not have been caught above
        console.log("401 error caught in catch block, refreshing token...");
        await this.handleTokenRefresh();
        return this.request(method, path, data, params, 1);
      }
      console.error(`Request failed for ${method} ${url}:`, error);
      throw error;
    }
  }

  // Generic GET request
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  // Generic POST request
  async post<T>(path: string, data: any): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  // Generic PUT request
  async put<T>(path: string, data: any): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  // Generic DELETE request
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // Entity-specific methods
  async getEntities<T extends Entity>(
    entityType: string, 
    params?: ListParams
  ): Promise<ListResponse<T>> {
    return this.get<ListResponse<T>>(`/${entityType}`, params);
  }

  async getEntity<T extends Entity>(
    entityType: string, 
    id: string
  ): Promise<T> {
    return this.get<T>(`/${entityType}/${id}`);
  }

  async createEntity<T extends Entity>(
    entityType: string, 
    data: Partial<T>
  ): Promise<T> {
    return this.post<T>(`/${entityType}`, data);
  }

  async updateEntity<T extends Entity>(
    entityType: string, 
    id: string, 
    data: Partial<T>
  ): Promise<T> {
    return this.put<T>(`/${entityType}/${id}`, data);
  }

  async deleteEntity(
    entityType: string, 
    id: string
  ): Promise<void> {
    return this.delete(`/${entityType}/${id}`);
  }

  // Search functionality
  async search(
    query: string, 
    entityTypes?: string[], 
    maxSize?: number
  ): Promise<any> {
    return this.get('/search', {
      query,
      entityTypes,
      maxSize
    });
  }

  // Metadata
  async getEntityMetadata(entityType: string): Promise<any> {
    return this.get(`/metadata/${entityType}`);
  }

  async getEntityFields(entityType: string): Promise<any> {
    return this.get(`/metadata/${entityType}/fields`);
  }

  // Get entity relationships metadata
  async getEntityRelationships(entityType: string): Promise<any> {
    return this.get(`/metadata/${entityType}/relationships`);
  }

  // Get comprehensive metadata for dynamic rendering
  async getDynamicEntityMetadata(entityType: string): Promise<any> {
    return this.get(`/dynamic-metadata/${entityType}`);
  }

  // Get related entities
  async getRelatedEntities<T extends Entity>(
    entityType: string,
    entityId: string,
    relationship: string,
    params?: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      orderDirection?: 'asc' | 'desc' 
    }
  ): Promise<ListResponse<T>> {
    return this.get<ListResponse<T>>(
      `/${entityType}/${entityId}/${relationship}`,
      params
    );
  }

  // Check if a relationship exists and has data
  async checkRelationshipExists(
    entityType: string,
    entityId: string,
    relationship: string
  ): Promise<{ exists: boolean }> {
    return this.get<{ exists: boolean }>(
      `/${entityType}/${entityId}/checkRelationship/${relationship}`
    );
  }

  // Get entity layouts
  async getEntityLayouts(entityType: string): Promise<any> {
    return this.get(`/metadata/${entityType}/layouts`);
  }

  // Get entity dynamic logic
  async getEntityDynamicLogic(entityType: string): Promise<any> {
    return this.get(`/metadata/${entityType}/dynamic-logic`);
  }

  // Refresh entity metadata
  async refreshEntityMetadata(entityType: string): Promise<any> {
    return this.post(`/metadata/${entityType}/refresh`, {});
  }

  async getAutopsyDetail(id: string): Promise<any> {
    return this.get(`/autopsies/${id}/detail`);
  }
  
  // Invalidate autopsy cache
  async invalidateAutopsyCache(id: string): Promise<any> {
    return this.post(`/autopsies/${id}/invalidate-cache`, {});
  }
  
  // Weather API
  async getWeather(lat: string, lon: string): Promise<any> {
    return this.get(`/weather?lat=${lat}&lon=${lon}`);
  }

  // Timeline specific methods
  async getTimelineEvents(params: {
    from: string;
    to: string;
    userIdList?: string;
    scopeList?: string;
  }): Promise<any[]> {
    return this.get('/timeline', params);
  }

  async getEventEntityTypes(): Promise<string[]> {
    return this.get('/timeline/entity-types');
  }

  async getTimelineSettings(): Promise<{ eventEntityTypes: string[] }> {
    return this.get('/timeline/settings');
  }

  async saveTimelineSettings(settings: { eventEntityTypes: string[] }): Promise<{ success: boolean }> {
    return this.post('/timeline/settings', settings);
  }

  // Get socket configuration for chat
  async getSocketConfig(): Promise<{ url: string; path: string }> {
    return this.get('/chat/socket-config');
  }

  // Chat specific methods
  async getConversations(): Promise<{ conversations: any[] }> {
    return this.get('/chat/conversations');
  }

  async getConversationMessages(conversationId: string, limit = 50, offset = 0): Promise<{ messages: any[] }> {
    return this.get(`/chat/conversations/${conversationId}/messages`, { limit, offset });
  }

  async createConversation(data: { 
    participantIds: string[];
    name?: string;
    isGroup?: boolean;
  }): Promise<any> {
    return this.post('/chat/conversations', data);
  }

  async addParticipant(conversationId: string, userId: string): Promise<{ success: boolean }> {
    return this.post(`/chat/conversations/${conversationId}/participants`, { userId });
  }

  async removeParticipant(conversationId: string, participantId: string): Promise<{ success: boolean }> {
    return this.delete(`/chat/conversations/${conversationId}/participants/${participantId}`);
  }

  async getUnreadCounts(): Promise<{ totalUnread: number; unreadByConversation: Record<string, number> }> {
    return this.get('/chat/unread');
  }

  async getNotifications(params?: { 
    limit?: number; 
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<{ notifications: any[]; unreadCount: number }> {
    return this.get('/notifications', params);
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return this.post(`/notifications/${id}/read`, {});
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
    return this.post('/notifications/read-all', {});
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();