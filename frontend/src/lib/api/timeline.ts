import { apiClient } from '@/lib/api-client';

// Types
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
  [key: string]: any;
}

export interface TimelineParams {
  from: string;       // ISO date string
  to: string;         // ISO date string
  userIdList?: string; // Comma-separated user IDs
  scopeList?: string;  // Comma-separated entity types
}

export interface TimelineSettings {
  eventEntityTypes: string[];
}

// Get timeline events - FIXED PATH: removed /api prefix
export async function getTimelineEvents(params: TimelineParams): Promise<TimelineEvent[]> {
  try {
    return await apiClient.get<TimelineEvent[]>('/timeline', params);
  } catch (error) {
    console.error('Failed to fetch timeline events:', error);
    throw error;
  }
}

// Get available event entity types - FIXED PATH: removed /api prefix
export async function getEventEntityTypes(): Promise<string[]> {
  try {
    return await apiClient.get<string[]>('/timeline/entity-types');
  } catch (error) {
    console.error('Failed to fetch event entity types:', error);
    throw error;
  }
}

// Get timeline settings - FIXED PATH: removed /api prefix
export async function getTimelineSettings(): Promise<TimelineSettings> {
  try {
    return await apiClient.get<TimelineSettings>('/timeline/settings');
  } catch (error) {
    console.error('Failed to fetch timeline settings:', error);
    throw error;
  }
}

// Save timeline settings - FIXED PATH: removed /api prefix
export async function saveTimelineSettings(settings: TimelineSettings): Promise<{success: boolean}> {
  try {
    return await apiClient.post<{success: boolean}>('/timeline/settings', settings);
  } catch (error) {
    console.error('Failed to save timeline settings:', error);
    throw error;
  }
}

// Get users for filtering - FIXED PATH: removed /api prefix
export async function getUsers(): Promise<{id: string, name: string}[]> {
  try {
    return await apiClient.get<{id: string, name: string}[]>('/users');
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}