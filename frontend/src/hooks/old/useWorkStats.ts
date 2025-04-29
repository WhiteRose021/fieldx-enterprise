// hooks/useWeeklyStats.ts
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyStats {
  soilWork: {
    total: number;
    completed: number;
    percentage: number;
  };
  construction: {
    total: number;
    completed: number;
    percentage: number;
  };
  splicing: {
    total: number;
    completed: number;
    percentage: number;
  };
  allCompleted: {
    total: number;
    completed: number;
    percentage: number;
  };
  uniqueTechnicians: Set<string>;
  loading: boolean;
  error: string | null;
}

const initialStats = {
  soilWork: { total: 0, completed: 0, percentage: 0 },
  construction: { total: 0, completed: 0, percentage: 0 },
  splicing: { total: 0, completed: 0, percentage: 0 },
  allCompleted: { total: 0, completed: 0, percentage: 0 },
  uniqueTechnicians: new Set<string>(),
  loading: true,
  error: null
};

export function useWeeklyStats() {
  const [stats, setStats] = useState<WeeklyStats>(initialStats);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) throw new Error("Authentication token not found");

        // Calculate current week's date range
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Start from Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        
        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(weekEnd, 'yyyy-MM-dd');
        
        // Function to fetch all pages of results
        const fetchAllPages = async (endpoint: string) => {
          let allRecords: any[] = [];
          let page = 0;
          let hasMorePages = true;
          
          // Fetch first page to get total count
          const firstResponse = await fetch(
            `${endpoint}?skip=${page * 100}&limit=100`, 
            { headers: { Authorization: `Basic ${authToken}` } }
          );
          
          if (!firstResponse.ok) throw new Error(`Failed to fetch from ${endpoint}`);
          
          const firstData = await firstResponse.json();
          const totalCount = firstData.totalCount || 0;
          allRecords = [...allRecords, ...(firstData.list || [])];
          
          // Calculate how many more pages we need
          const totalPages = Math.ceil(totalCount / 100);
          
          // Fetch remaining pages if needed
          const remainingRequests = [];
          for (let i = 1; i < totalPages; i++) {
            remainingRequests.push(
              fetch(
                `${endpoint}?skip=${i * 100}&limit=100`, 
                { headers: { Authorization: `Basic ${authToken}` } }
              ).then(res => res.json())
            );
          }
          
          // Get all remaining results
          if (remainingRequests.length > 0) {
            const remainingResults = await Promise.all(remainingRequests);
            remainingResults.forEach(result => {
              allRecords = [...allRecords, ...(result.list || [])];
            });
          }
          
          return { 
            list: allRecords,
            totalCount
          };
        };
        
        // Fetch data for soil work
        const soilData = await fetchAllPages("http://192.168.4.150:8080/api/v1/CChomatourgika");
        
        // Fetch data for construction
        const constructionData = await fetchAllPages("http://192.168.4.150:8080/api/v1/KataskeyesFTTH");
        
        // Fetch data for splicing
        const splicingData = await fetchAllPages("http://192.168.4.150:8080/api/v1/CSplicingWork");
        
        // Process the data
        const uniqueTechnicians = new Set<string>();
        
        const processData = (data: any) => {
          const list = data.list || [];
          
          // Filter for just this week's records if needed
          const thisWeekRecords = list.filter((item: any) => {
            if (!item.dateStart) return false;
            const itemDate = new Date(item.dateStart);
            return itemDate >= weekStart && itemDate <= weekEnd;
          });
          
          const total = thisWeekRecords.length;
          const completed = thisWeekRecords.filter((item: any) => item.status === 'ΟΛΟΚΛΗΡΩΣΗ').length;
          
          // Collect unique technicians
          thisWeekRecords.forEach((item: any) => {
            if (item.assignedUserName) uniqueTechnicians.add(item.assignedUserName);
            if (item.assignedUser) uniqueTechnicians.add(item.assignedUser);
          });
          
          return {
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        };
        
        const soilStats = processData(soilData);
        const constructionStats = processData(constructionData);
        const splicingStats = processData(splicingData);
        
        // Calculate totals
        const totalItems = soilStats.total + constructionStats.total + splicingStats.total;
        const totalCompleted = soilStats.completed + constructionStats.completed + splicingStats.completed;
        
        setStats({
          soilWork: soilStats,
          construction: constructionStats,
          splicing: splicingStats,
          allCompleted: {
            total: totalItems,
            completed: totalCompleted,
            percentage: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0
          },
          uniqueTechnicians,
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error("Error fetching weekly stats:", err);
        setStats({
          ...initialStats,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load weekly statistics"
        });
      }
    };
    
    fetchWeeklyStats();
  }, []);
  
  return stats;
}