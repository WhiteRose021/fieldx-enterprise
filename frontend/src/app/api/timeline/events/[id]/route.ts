// src/lib/api/timeline.ts
import { format } from 'date-fns';
import { AppointmentType, Technician, TimelineEvent, WorkDetails } from '@/types/timeline';

/**
 * API service for timeline-related functionality
 */
class TimelineService {
  /**
   * Fetch technicians
   */
  async getTechnicians(): Promise<Technician[]> {
    try {
      const response = await fetch('/api/timeline/technicians', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching technicians: ${response.status}`);
      }

      const data = await response.json();
      return data.technicians || [];
    } catch (error) {
      console.error('Error in getTechnicians:', error);
      throw error;
    }
  }

  /**
   * Fetch timeline events for a specific date
   */
  async getEvents(date: Date): Promise<TimelineEvent[]> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/timeline/events?date=${dateStr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching events: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert date strings to Date objects if needed
      const events = data.events || [];
      return events.map((event: any) => ({
        ...event,
        start: event.start, // Keep as string since the component expects strings
        end: event.end,   // Keep as string since the component expects strings
      }));
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  /**
   * Fetch work details for a specific record
   */
  async getWorkDetails(recordId: string, appointmentType?: AppointmentType): Promise<WorkDetails> {
    try {
      let url = `/api/timeline/work-details?recordId=${recordId}`;
      if (appointmentType) {
        url += `&appointmentType=${appointmentType}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching work details: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getWorkDetails:', error);
      throw error;
    }
  }

  /**
   * Update a timeline event
   */
  async updateEvent(event: TimelineEvent): Promise<TimelineEvent> {
    try {
      if (!event.id) {
        throw new Error('Event ID is required');
      }

      const response = await fetch(`/api/timeline/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: event.start,
          end: event.end,
          details: event.details,
          appointmentType: event.appointmentType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating event: ${response.status}`);
      }

      const data = await response.json();
      return data.event;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const timelineService = new TimelineService();