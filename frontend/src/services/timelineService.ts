// src/services/timelineService.ts
import { format } from 'date-fns';

// Types
export type AppointmentType = 'AUTOPSY' | 'CONSTRUCTION' | 'SPLICING' | 'EARTHWORK';

export interface Technician {
  id: string;
  name: string;
  team: string;
}

export interface TimelineEvent {
  id: string;
  name: string;
  start: Date | string;
  end: Date | string;
  technicianName: string;
  technicianId?: string;
  status?: string;
  sr?: string;
  srText?: string;
  testRecordId?: string;
  area?: string;
  details?: string;
  appointmentType?: AppointmentType;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface WorkDetails {
  id: string;
  title: string;
  address: string;
  area: string;
  sr: string;
  status: string;
  difficulty: string;
  difficultyValue: string;
  jobType: string;
  estimatedHours: string;
  priority: string;
  requiredTechnicians: string;
  channels: boolean;
  excavation: boolean;
  conduit: boolean;
  ftu: boolean;
  usage: boolean;
  bmo: string;
  bcp: boolean;
  description: string;
  team: string;
  date: string;
  timeSlot: string;
  latitude: number;
  longitude: number;
}

// API error handling utility
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Timeline service
class TimelineService {
  private readonly baseUrl: string;
  
  constructor() {
    this.baseUrl = '/api/timeline';
  }
  
  // Utility method for handling responses
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response', e);
      }
      throw new ApiError(errorMessage, response.status);
    }
    return await response.json();
  }
  
  // Get technicians
  async getTechnicians(): Promise<Technician[]> {
    try {
      const response = await fetch(`${this.baseUrl}/technicians`);
      const data = await this.handleResponse<{ technicians: Technician[] }>(response);
      return data.technicians;
    } catch (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
  }
  
  // Get timeline events for a specific date
  async getEvents(date: Date): Promise<TimelineEvent[]> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`${this.baseUrl}/events?date=${dateStr}`);
      const data = await this.handleResponse<{ events: TimelineEvent[] }>(response);
      
      // Convert string dates to Date objects
      return data.events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
  
  // Get work details
  async getWorkDetails(recordId: string, appointmentType?: AppointmentType): Promise<WorkDetails> {
    try {
      let url = `${this.baseUrl}/work-details?recordId=${recordId}`;
      if (appointmentType) {
        url += `&appointmentType=${appointmentType}`;
      }
      
      const response = await fetch(url);
      return await this.handleResponse<WorkDetails>(response);
    } catch (error) {
      console.error('Error fetching work details:', error);
      throw error;
    }
  }
  
  // Update an event
  async updateEvent(event: TimelineEvent): Promise<TimelineEvent> {
    try {
      if (!event.id) {
        throw new Error('Event ID is required for update');
      }
      
      // Format dates to strings if they are Date objects
      const payload = {
        ...event,
        start: event.start instanceof Date ? format(event.start, "yyyy-MM-dd HH:mm:ss") : event.start,
        end: event.end instanceof Date ? format(event.end, "yyyy-MM-dd HH:mm:ss") : event.end
      };
      
      const response = await fetch(`${this.baseUrl}/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await this.handleResponse<{ event: TimelineEvent }>(response);
      
      // Convert string dates to Date objects
      return {
        ...data.event,
        start: new Date(data.event.start),
        end: new Date(data.event.end)
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const timelineService = new TimelineService();