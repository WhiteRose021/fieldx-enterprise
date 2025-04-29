import { useState, useEffect } from 'react';
import { API_CONFIG } from './constants';

// Define the task object structure
interface Task {
  status?: string;
  completedAt?: string;
  dateStart?: string;
  createdAt?: string;
  user?: string;
  assignedTo?: string;
  assignedUserName?: string;
  createdBy?: string;
  [key: string]: any; // Allow other properties
}

interface YearlyStats {
  monthlyData: Record<string, { 
    month: string; 
    soil: number; 
    construction: number; 
    splicing: number; 
    completed: number 
  }>;
  yearToDateGrowth: number;
  loading: boolean;
}

export const useYearlyStats = () => {
  const [stats, setStats] = useState<YearlyStats>({
    monthlyData: {},
    yearToDateGrowth: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) throw new Error("No auth token");

        const fetchTasks = async (url: string): Promise<Task[]> => {
          const response = await fetch(url, { 
            headers: { Authorization: `Basic ${authToken}` } 
          });
          if (!response.ok) throw new Error(`Failed to fetch from ${url}`);
          const data = await response.json();
          return data.list || [];
        };

        // Fetch all tasks
        const soilWorkTasks = await fetchTasks(API_CONFIG.EARTHWORK.url);
        const constructionTasks = await fetchTasks(API_CONFIG.LAST_DROP.url);
        const splicingTasks = await fetchTasks(API_CONFIG.SPLICING.url);

        // Filter completed tasks
        const completedSoilWorkTasks = soilWorkTasks.filter(task => task.status === 'ΟΛΟΚΛΗΡΩΣΗ');
        const completedConstructionTasks = constructionTasks.filter(task => task.status === 'ΟΛΟΚΛΗΡΩΣΗ');
        const completedSplicingTasks = splicingTasks.filter(task => task.status === 'ΟΛΟΚΛΗΡΩΣΗ');

        // Group tasks by month
        const groupTasksByMonth = (tasks: Task[]): Record<string, Task[]> => {
          const grouped: Record<string, Task[]> = {};
          
          tasks.forEach(task => {
            // Only use createdAt for determining the month
            if (!task.createdAt) return;
            
            const date = new Date(task.createdAt);
            const monthKey = date.toLocaleString('el-GR', { month: 'short' });
            
            if (!grouped[monthKey]) {
              grouped[monthKey] = [];
            }
            
            grouped[monthKey].push(task);
          });
          
          return grouped;
        };
        
        const soilWorkByMonth = groupTasksByMonth(completedSoilWorkTasks);
        const constructionByMonth = groupTasksByMonth(completedConstructionTasks);
        const splicingByMonth = groupTasksByMonth(completedSplicingTasks);

        // Get all unique months from the current year and the previous year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const monthsArray: string[] = [];
        
        // Add last year's months
        for (let i = 0; i < 12; i++) {
          const date = new Date(currentYear - 1, i, 1);
          monthsArray.push(date.toLocaleString('el-GR', { month: 'short' }));
        }
        
        // Add current year's months
        for (let i = 0; i < currentDate.getMonth() + 1; i++) {
          const date = new Date(currentYear, i, 1);
          monthsArray.push(date.toLocaleString('el-GR', { month: 'short' }));
        }
        
        // Remove duplicates
        const allMonths = [...new Set(monthsArray)];

        // Create monthly data with the month property included
        const monthlyData: Record<string, { 
          month: string; 
          soil: number; 
          construction: number; 
          splicing: number; 
          completed: number 
        }> = {};
        
        allMonths.forEach(month => {
          const soil = soilWorkByMonth[month] ? soilWorkByMonth[month].length : 0;
          const construction = constructionByMonth[month] ? constructionByMonth[month].length : 0;
          const splicing = splicingByMonth[month] ? splicingByMonth[month].length : 0;
          
          monthlyData[month] = {
            month, // Add the month property
            soil,
            construction,
            splicing,
            completed: soil + construction + splicing
          };
        });

        // Calculate year-to-date growth
        const calculateYearToDateGrowth = (): number => {
          // Get current month
          const currentMonthKey = currentDate.toLocaleString('el-GR', { month: 'short' });
          
          // Get same month last year
          const lastYearSameMonth = new Date(currentYear - 1, currentDate.getMonth(), 1);
          const lastYearMonthKey = lastYearSameMonth.toLocaleString('el-GR', { month: 'short' });
          
          // Get completed tasks for current year up to current month
          let currentYearTotal = 0;
          for (let i = 0; i <= currentDate.getMonth(); i++) {
            const monthDate = new Date(currentYear, i, 1);
            const monthKey = monthDate.toLocaleString('el-GR', { month: 'short' });
            if (monthlyData[monthKey]) {
              currentYearTotal += monthlyData[monthKey].completed;
            }
          }
          
          // Get completed tasks for previous year up to same month
          let previousYearTotal = 0;
          for (let i = 0; i <= currentDate.getMonth(); i++) {
            const monthDate = new Date(currentYear - 1, i, 1);
            const monthKey = monthDate.toLocaleString('el-GR', { month: 'short' });
            if (monthlyData[monthKey]) {
              previousYearTotal += monthlyData[monthKey].completed;
            }
          }
          
          // Calculate growth
          if (previousYearTotal === 0) return currentYearTotal > 0 ? 100 : 0;
          return Number(((currentYearTotal - previousYearTotal) / previousYearTotal * 100).toFixed(1));
        };

        setStats({
          monthlyData,
          yearToDateGrowth: calculateYearToDateGrowth(),
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching yearly stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  return stats;
};