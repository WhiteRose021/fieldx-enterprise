import * as encore from 'encore.dev';
import axios from 'axios';
import { getClient } from './client';
// Import the Logger class
import { Logger } from '../core/logger';

// Define ApiError
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// Import RedisService
import { RedisService } from '../core/redis';
// Initialize RedisService
const redis = RedisService.getInstance();

// Define the Timeline API endpoint
const TIMELINE_ENDPOINT = '/api/v1/Timeline';

// Cache TTL 
const CACHE_TTL = 5 * 60; // 5 minutes

// Define the params for the Timeline API
export interface TimelineParams {
  from: string;       // ISO date string
  to: string;         // ISO date string
  userIdList?: string; // Comma-separated user IDs
  scopeList?: string;  // Comma-separated entity types
}

// Define the structure of a timeline event
export interface TimelineEvent {
  id: string;
  entityType: string;
  name: string;
  dateStart: string;
  dateEnd?: string;
  status?: string;
  userId?: string;
  userFullName?: string;
  color?: string;
  description?: string;
  [key: string]: any; // Allow for additional fields
}

// Get available event entity types from metadata
export async function getEventEntityTypes(): Promise<string[]> {
  try {
    const cacheKey = 'timeline:event-entity-types';
    
    // Try to get from cache first
    const cached = await redis.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const client = getClient();
    
    // Get all entity types from metadata
    const metadataResponse = await client.request('GET', 'Metadata/entityDefs');
    
    const eventEntities: string[] = [];
    
    // Filter for entities that are marked as calendar/event types
    for (const [entityName, entityData] of Object.entries(metadataResponse)) {
      const entity = entityData as any;
      
      if (
        entity.isCalendarEntity || 
        entity.calendar || 
        entity.object === 'Event' ||
        entity.type === 'Event' ||
        // Also check for date fields that indicate this could be an event
        (entity.fields && (entity.fields.dateStart || (entity.fields.date && entity.fields.status)))
      ) {
        eventEntities.push(entityName);
      }
    }
    
    Logger.info(`Found ${eventEntities.length} event entity types`);
    
    // Cache the result - use set method from RedisService
    await redis.set(cacheKey, eventEntities, CACHE_TTL);
    
    return eventEntities;
  } catch (error) {
    Logger.error('Failed to fetch event entity types', { error });
    throw new ApiError('Failed to fetch event entity types', 500);
  }
}

// Timeline API endpoint to get events
export async function getTimeline(
  from: string,
  to: string,
  userIdList?: string,
  scopeList?: string
): Promise<TimelineEvent[]> {
  try {
    const client = getClient();
    
    // If no scopeList provided, fetch all event entity types
    if (!scopeList) {
      const eventTypes = await getEventEntityTypes();
      scopeList = eventTypes.join(',');
    }
    
    const params: TimelineParams = {
      from,
      to,
      userIdList,
      scopeList
    };
    
    Logger.info('Fetching timeline events', { params });
    
    // Build cache key from parameters
    const cacheKey = `timeline:events:${JSON.stringify(params)}`;
    
    // Try to get from cache first
    const cached = await redis.get<TimelineEvent[]>(cacheKey);
    if (cached) {
      Logger.info(`Using cached timeline events for params: ${JSON.stringify(params)}`);
      return cached;
    }
    
    const response = await client.request('GET', 'Timeline', params);
    
    Logger.info(`Retrieved ${response.length} timeline events`);
    
    // Cache the result - use set method from RedisService
    await redis.set(cacheKey, response, CACHE_TTL);
    
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      Logger.error('Timeline API error', { 
        status: error.response?.status, 
        data: error.response?.data 
      });
      throw new ApiError(`Timeline API error: ${error.message}`, 
        error.response?.status || 500);
    }
    
    Logger.error('Failed to fetch timeline events', { error });
    throw new ApiError('Failed to fetch timeline events', 500);
  }
}

// Timeline settings API to get and set which entity types should be displayed
export async function getTimelineSettings(userId?: string): Promise<{eventEntityTypes: string[]}> {
  const userKey = userId || 'default';
  const cacheKey = `timeline:settings:${userKey}`;
  
  // Try to get from cache first
  const cached = await redis.get<{eventEntityTypes: string[]}>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // In a real implementation, this would fetch from a database
  // For now, we'll return all event entity types
  const eventTypes = await getEventEntityTypes();
  const settings = { eventEntityTypes: eventTypes };
  
  // Cache the result - use set method from RedisService
  await redis.set(cacheKey, settings, 3600); // 1 hour
  
  return settings;
}

// API to save timeline settings
export async function saveTimelineSettings(
  settings: {eventEntityTypes: string[]},
  userId?: string
): Promise<{success: boolean}> {
  const userKey = userId || 'default';
  const cacheKey = `timeline:settings:${userKey}`;
  
  // In a real implementation, this would save to a database
  Logger.info('Saving timeline settings', { settings, userId });
  
  // Cache the settings - use set method from RedisService
  await redis.set(cacheKey, settings, 3600); // 1 hour
  
  return { success: true };
}