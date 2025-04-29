import { useState, useEffect, useCallback } from 'react';

// Define the timeline event structure
export interface TimelineEvent {
  time: string;
  event: string;
  technician: string;
  type: string;
}

// Define the Note API response structure
interface NoteApiResponse {
  id: string;
  post?: string | null;
  type?: string;
  createdAt: string;
  createdByName?: string;
  parentType?: string;
  parentName?: string;
  data?: any;
}

// Define the hook return type
interface UseTimelineEventsReturn {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

/**
 * Custom hook to fetch and process timeline events from the Note API
 */
export const useTimelineEvents = (): UseTimelineEventsReturn => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch and process timeline events
  const fetchTimelineEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      // Fetch data from the Note API
      const response = await fetch("http://192.168.4.150:8080/api/v1/Note", {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch from Note API: ${response.status}`);
      
      const data = await response.json();
      
      if (!data?.list || !Array.isArray(data.list)) {
        setEvents([]);
        return;
      }
      
      // Process and transform the data into TimelineEvent format
      const processedEvents = data.list
        .filter((note: NoteApiResponse) => note.createdAt && note.createdByName)
        .map((note: NoteApiResponse) => {
          // Determine event type based on parentType or type
          let eventType = "admin"; // Default type
          
          if (note.parentType) {
            if (note.parentType.includes("Chomatourgika") || note.parentType.includes("CEarthWork")) {
              eventType = "soil";
            } else if (note.parentType.includes("Kataskeyes") || note.parentType.includes("Construction")) {
              eventType = "construction";
            } else if (note.parentType.includes("Splicing")) {
              eventType = "splicing";
            } else if (note.parentType.includes("Test") || note.parentType.includes("Aytopsies")) {
              eventType = "inspection";
            }
          }
          
          // If the note has status data and it's an error or rejection
          if (note.data?.value === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ" || note.data?.value === "ΑΠΟΡΡΙΨΗ") {
            eventType = "issue";
          }
          
          // Format time from createdAt
          const createdDate = new Date(note.createdAt);
          const time = createdDate.toLocaleTimeString("el-GR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          
          // Create event description
          let event = "";
          
          if (note.type === "Status" && note.data?.value) {
            if (note.data.value === "ΟΛΟΚΛΗΡΩΣΗ") {
              event = `Ολοκληρώθηκε η εργασία ${note.parentName || ""}`;
            } else if (note.data.value === "ΑΠΟΣΤΟΛΗ" || note.data.value === "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ") {
              event = `Προγραμματίστηκε εργασία ${note.parentName || ""}`;
            } else if (note.data.value === "ΑΠΟΡΡΙΨΗ" || note.data.value === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ") {
              event = `Αναφέρθηκε πρόβλημα στην εργασία ${note.parentName || ""}`;
            } else {
              event = `Ενημέρωση κατάστασης εργασίας ${note.parentName || ""}: ${note.data.value}`;
            }
          } else if (note.type === "Post" && note.post) {
            event = `Σχόλιο σχετικά με ${note.parentName || ""}: ${note.post.substring(0, 50)}${note.post.length > 50 ? '...' : ''}`;
          } else if (note.type === "Update") {
            event = `Ενημέρωση στοιχείων για ${note.parentName || ""}`;
          } else {
            event = note.parentName || "Ενημέρωση συστήματος";
          }
          
          return {
            time,
            event,
            technician: note.createdByName || "Σύστημα",
            type: eventType,
          };
        })
        .sort((a, b) => {
          // Sort by time in descending order (most recent first)
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          // Compare hours
          if (timeB[0] !== timeA[0]) {
            return timeB[0] - timeA[0];
          }
          
          // If hours are equal, compare minutes
          return timeB[1] - timeA[1];
        })
        .slice(0, 5); // Get only the 5 most recent events
      
      setEvents(processedEvents);
    } catch (err) {
      console.error("Error fetching timeline events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch timeline events");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchTimelineEvents();
    
    // Set up refresh interval (every 2 minutes)
    const interval = setInterval(fetchTimelineEvents, 120000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchTimelineEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents: fetchTimelineEvents
  };
};