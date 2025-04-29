import { useState, useEffect, useCallback } from 'react';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { 
  getTimelineEvents, 
  getEventEntityTypes, 
  getTimelineSettings, 
  saveTimelineSettings,
  TimelineEvent, 
  TimelineParams 
} from '@/lib/api/timeline';
import { apiClient } from '@/lib/api-client';

// Define the User interface based on EspoCRM data structure
interface User {
  id: string;
  name: string;
  deleted?: boolean;
  userName?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  type?: string;
  teamsIds?: string[];
  teamsNames?: Record<string, string>;
  defaultTeamId?: string;
  defaultTeamName?: string;
  [key: string]: any;
}

interface TimelineState {
  events: TimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedUsers: string[];
  availableUsers: User[];
  selectedEntityTypes: string[];
  availableEntityTypes: string[];
}

export function useTimeline() {
  const [state, setState] = useState<TimelineState>({
    events: [],
    isLoading: true,
    error: null,
    dateRange: {
      start: startOfDay(new Date()),
      end: endOfDay(addDays(new Date(), 7))
    },
    selectedUsers: [],
    availableUsers: [],
    selectedEntityTypes: [],
    availableEntityTypes: []
  });

  // Fetch technicians for filtering
  const fetchUsers = useCallback(async () => {
    try {
      // Use the API route that calls our technicians endpoint
      const response = await apiClient.get<{list: User[], total: number}>('/api/users/technicians');
      
      setState(prev => ({
        ...prev,
        availableUsers: response.list || []
      }));
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to fetch technicians')
      }));
    }
  }, []);

  // Fetch entity types that can be displayed on timeline
  const fetchEntityTypes = useCallback(async () => {
    try {
      const entityTypes = await getEventEntityTypes();
      const settings = await getTimelineSettings();
      
      setState(prev => ({
        ...prev,
        availableEntityTypes: entityTypes,
        selectedEntityTypes: settings.eventEntityTypes
      }));
    } catch (error) {
      console.error('Error fetching entity types:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to fetch entity types')
      }));
    }
  }, []);

  // Fetch timeline events
  const fetchEvents = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { start, end } = state.dateRange;
      
      const params: TimelineParams = {
        from: format(start, "yyyy-MM-dd HH:mm"),
        to: format(end, "yyyy-MM-dd HH:mm")
      };
      
      // Add selected users if any
      if (state.selectedUsers.length > 0) {
        params.userIdList = state.selectedUsers.join(',');
      }
      
      // Add selected entity types if any
      if (state.selectedEntityTypes.length > 0) {
        params.scopeList = state.selectedEntityTypes.join(',');
      }
      
      const events = await getTimelineEvents(params);
      
      setState(prev => ({
        ...prev,
        events,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to fetch timeline events'),
        isLoading: false
      }));
    }
  }, [state.dateRange, state.selectedUsers, state.selectedEntityTypes]);

  // Update date range
  const setDateRange = useCallback((start: Date, end: Date) => {
    setState(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  // Toggle user selection
  const toggleUser = useCallback((userId: string) => {
    setState(prev => {
      const selectedUsers = prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId];
      
      return {
        ...prev,
        selectedUsers
      };
    });
  }, []);

  // Toggle entity type selection
  const toggleEntityType = useCallback((entityType: string) => {
    setState(prev => {
      const selectedEntityTypes = prev.selectedEntityTypes.includes(entityType)
        ? prev.selectedEntityTypes.filter(type => type !== entityType)
        : [...prev.selectedEntityTypes, entityType];
      
      return {
        ...prev,
        selectedEntityTypes
      };
    });
  }, []);

  // Select all entity types
  const selectAllEntityTypes = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedEntityTypes: [...prev.availableEntityTypes]
    }));
  }, []);

  // Clear all entity type selections
  const clearEntityTypeSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedEntityTypes: []
    }));
  }, []);

  // Save current entity type selection as user preference
  const saveEntityTypeSelection = useCallback(async () => {
    try {
      await saveTimelineSettings({
        eventEntityTypes: state.selectedEntityTypes
      });
    } catch (error) {
      console.error('Error saving entity type selection:', error);
    }
  }, [state.selectedEntityTypes]);

  // Initial data load
  useEffect(() => {
    fetchUsers();
    fetchEntityTypes();
  }, [fetchUsers, fetchEntityTypes]);

  // Fetch events when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    dateRange: state.dateRange,
    selectedUsers: state.selectedUsers,
    availableUsers: state.availableUsers,
    selectedEntityTypes: state.selectedEntityTypes,
    availableEntityTypes: state.availableEntityTypes,
    setDateRange,
    toggleUser,
    toggleEntityType,
    selectAllEntityTypes,
    clearEntityTypeSelection,
    saveEntityTypeSelection,
    refreshEvents: fetchEvents
  };
}