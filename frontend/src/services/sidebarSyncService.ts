/**
 * Service to sync sidebar preferences with the backend
 * This enables a hybrid approach: fast local storage for immediate UI
 * with backend sync for cross-device consistency
 */

import { throttle } from 'lodash-es';

export interface SidebarState {
  isCollapsed: boolean;
  openGroups: Record<string, boolean>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class SidebarSyncService {
  private static instance: SidebarSyncService;
  private throttledSync: (state: SidebarState) => void;
  
  private constructor() {
    // Create a throttled sync function that won't run more than once every 5 seconds
    this.throttledSync = throttle(this.syncToBackend, 5000, { leading: false, trailing: true });
  }
  
  public static getInstance(): SidebarSyncService {
    if (!SidebarSyncService.instance) {
      SidebarSyncService.instance = new SidebarSyncService();
    }
    return SidebarSyncService.instance;
  }
  
  /**
   * Call this when sidebar state changes to sync to backend
   */
  public syncState(state: SidebarState): void {
    this.throttledSync(state);
  }
  
  /**
   * Fetch sidebar preferences from backend
   */
  public async fetchFromBackend(): Promise<SidebarState | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      const response = await fetch(`${API_URL}/user/preferences/sidebar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error('Error fetching sidebar preferences:', error);
      return null;
    }
  }
  
  /**
   * Sync sidebar state to backend
   */
  private async syncToBackend(state: SidebarState): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      await fetch(`${API_URL}/user/preferences/sidebar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: state }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error syncing sidebar preferences:', error);
    }
  }
}

export const sidebarSyncService = SidebarSyncService.getInstance();
export default sidebarSyncService;