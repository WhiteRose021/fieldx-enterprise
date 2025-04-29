import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from './constants';

// Define the job location data structure
export interface LocationData {
  area: string;
  soilWork: number;
  construction: number;
  splicing: number;
  completed: number;
  progress: number;
}

// Define the hook return type
interface UseJobLocationsReturn {
  jobLocations: LocationData[];
  loading: boolean;
  error: string | null;
  refreshLocations: () => Promise<void>;
}

/**
 * Custom hook to fetch and process job location data from various APIs
 */
export const useJobLocations = (): UseJobLocationsReturn => {
  const [jobLocations, setJobLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract area from job data based on job type
  const extractArea = useCallback((job: any): string => {
    let area = "";
    
    // 1. Try perioxi field (KataskeyesBFasi)
    if (job.perioxi) {
      area = job.perioxi;
    } 
    // 2. Try nameLink field (CChomatourgika)
    else if (job.nameLink) {
      const match = job.nameLink.match(/Δ\.\s*([^,]+)/);
      area = match ? `Δ. ${match[1]}` : "";
    } 
    // 3. Try name field (CSplicingWork)
    else if (job.name) {
      const match = job.name.match(/Δ\.\s*([^,]+)/);
      area = match ? `Δ. ${match[1]}` : "";
    }
    
    return area;
  }, []);

  // Process job data and organize by location
  const processJobData = useCallback((earthwork: any[], construction: any[], splicing: any[]): LocationData[] => {
    const locationsMap: Record<string, LocationData> = {};
    
    // Process earthwork jobs
    earthwork.forEach(job => {
      const area = extractArea(job);
      if (!area) return;
      
      if (!locationsMap[area]) {
        locationsMap[area] = {
          area,
          soilWork: 0,
          construction: 0,
          splicing: 0,
          completed: 0,
          progress: 0
        };
      }
      
      locationsMap[area].soilWork++;
      if (job.status === "ΟΛΟΚΛΗΡΩΣΗ") {
        locationsMap[area].completed++;
      }
    });
    
    // Process construction jobs
    construction.forEach(job => {
      const area = extractArea(job);
      if (!area) return;
      
      if (!locationsMap[area]) {
        locationsMap[area] = {
          area,
          soilWork: 0,
          construction: 0,
          splicing: 0,
          completed: 0,
          progress: 0
        };
      }
      
      locationsMap[area].construction++;
      if (job.status === "ΟΛΟΚΛΗΡΩΣΗ") {
        locationsMap[area].completed++;
      }
    });
    
    // Process splicing jobs
    splicing.forEach(job => {
      const area = extractArea(job);
      if (!area) return;
      
      if (!locationsMap[area]) {
        locationsMap[area] = {
          area,
          soilWork: 0,
          construction: 0,
          splicing: 0,
          completed: 0,
          progress: 0
        };
      }
      
      locationsMap[area].splicing++;
      if (job.status === "ΟΛΟΚΛΗΡΩΣΗ") {
        locationsMap[area].completed++;
      }
    });
    
    // Calculate progress percentages
    Object.values(locationsMap).forEach(location => {
      const total = location.soilWork + location.construction + location.splicing;
      location.progress = total > 0 ? Math.round((location.completed / total) * 100) : 0;
    });
    
    // Convert to array and sort by area name
    return Object.values(locationsMap).sort((a, b) => a.area.localeCompare(b.area));
  }, [extractArea]);

  // Function to fetch data from all job APIs
  const fetchJobLocations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      // Set up headers for API requests
      const headers = {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      };
      
      // Fetch data from all job APIs in parallel
      const [earthworkResponse, constructionResponse, splicingResponse] = await Promise.all([
        fetch(API_CONFIG.EARTHWORK.url, { headers }),
        fetch(API_CONFIG.LAST_DROP.url, { headers }),
        fetch(API_CONFIG.SPLICING.url, { headers })
      ]);
      
      // Check for errors in any response
      if (!earthworkResponse.ok) throw new Error(`Failed to fetch earthwork data: ${earthworkResponse.status}`);
      if (!constructionResponse.ok) throw new Error(`Failed to fetch construction data: ${constructionResponse.status}`);
      if (!splicingResponse.ok) throw new Error(`Failed to fetch splicing data: ${splicingResponse.status}`);
      
      // Parse JSON responses
      const earthworkData = await earthworkResponse.json();
      const constructionData = await constructionResponse.json();
      const splicingData = await splicingResponse.json();
      
      // Process data and update state
      const processedLocations = processJobData(
        earthworkData.list || [],
        constructionData.list || [],
        splicingData.list || []
      );
      
      setJobLocations(processedLocations);
    } catch (err) {
      console.error("Error fetching job locations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch job location data");
    } finally {
      setLoading(false);
    }
  }, [processJobData]);

  // Fetch data on component mount
  useEffect(() => {
    fetchJobLocations();
    
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(fetchJobLocations, 300000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchJobLocations]);

  return {
    jobLocations,
    loading,
    error,
    refreshLocations: fetchJobLocations
  };
};