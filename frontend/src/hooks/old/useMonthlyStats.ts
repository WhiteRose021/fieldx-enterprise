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

interface MonthlyStats {
  soilWork: { completedTasks: number; growth: number; inProgressTasks: number };
  construction: { completedTasks: number; growth: number; inProgressTasks: number };
  splicing: { completedTasks: number; growth: number; inProgressTasks: number };
  all: { completedTasks: number; growth: number; inProgressTasks: number };
  uniqueTechnicians: Set<string>;
  loading: boolean;
}

export const useMonthlyStats = () => {
  const [stats, setStats] = useState<MonthlyStats>({
    soilWork: { completedTasks: 0, growth: 0, inProgressTasks: 0 },
    construction: { completedTasks: 0, growth: 0, inProgressTasks: 0 },
    splicing: { completedTasks: 0, growth: 0, inProgressTasks: 0 },
    all: { completedTasks: 0, growth: 0, inProgressTasks: 0 },
    uniqueTechnicians: new Set<string>(),
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

        // Current month data
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Filter tasks for current month
        const filterTasksForCurrentMonth = (tasks: Task[]): Task[] => {
          return tasks.filter(task => {
            // Only use createdAt for determining the month
            if (!task.createdAt) return false;
            
            const taskDate = new Date(task.createdAt);
            return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
          });
        };
        
        // Update the filterTasksForPreviousMonth function
        const filterTasksForPreviousMonth = (tasks: Task[]): Task[] => {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          
          return tasks.filter(task => {
            // Only use createdAt for determining the month
            if (!task.createdAt) return false;
            
            const taskDate = new Date(task.createdAt);
            return taskDate.getMonth() === prevMonth && taskDate.getFullYear() === prevYear;
          });
        };

        // Get completed tasks (status === 'ΟΛΟΚΛΗΡΩΣΗ')
        const getCompletedTasks = (tasks: Task[]): Task[] => 
          tasks.filter(task => task.status === 'ΟΛΟΚΛΗΡΩΣΗ');
        
        // Get in-progress tasks (status !== 'ΟΛΟΚΛΗΡΩΣΗ')
        const getInProgressTasks = (tasks: Task[]): Task[] => 
          tasks.filter(task => task.status && task.status !== 'ΟΛΟΚΛΗΡΩΣΗ');

        // Current month completed tasks
        const soilWorkCurrentCompleted = getCompletedTasks(filterTasksForCurrentMonth(soilWorkTasks));
        const constructionCurrentCompleted = getCompletedTasks(filterTasksForCurrentMonth(constructionTasks));
        const splicingCurrentCompleted = getCompletedTasks(filterTasksForCurrentMonth(splicingTasks));

        // Previous month completed tasks
        const soilWorkPreviousCompleted = getCompletedTasks(filterTasksForPreviousMonth(soilWorkTasks));
        const constructionPreviousCompleted = getCompletedTasks(filterTasksForPreviousMonth(constructionTasks));
        const splicingPreviousCompleted = getCompletedTasks(filterTasksForPreviousMonth(splicingTasks));

        // In-progress tasks
        const soilWorkInProgress = getInProgressTasks(soilWorkTasks);
        const constructionInProgress = getInProgressTasks(constructionTasks);
        const splicingInProgress = getInProgressTasks(splicingTasks);

        // Calculate growth percentages
        const calculateGrowth = (current: Task[], previous: Task[]): number => {
          if (previous.length === 0) return current.length > 0 ? 100 : 0;
          return Number(((current.length - previous.length) / previous.length * 100).toFixed(1));
        };

        // Collect unique technicians
        const technicians = new Set<string>();
        
        // Add technicians from all task types
        const addTechniciansFromTasks = (tasks: Task[]): void => {
          tasks.forEach(task => {
            if (task.user) technicians.add(task.user);
            if (task.assignedTo) technicians.add(task.assignedTo);
            if (task.assignedUserName) technicians.add(task.assignedUserName);
            if (task.createdBy) technicians.add(task.createdBy);
          });
        };
        
        addTechniciansFromTasks(soilWorkTasks);
        addTechniciansFromTasks(constructionTasks);
        addTechniciansFromTasks(splicingTasks);

        // Update stats
        setStats({
          soilWork: {
            completedTasks: soilWorkCurrentCompleted.length,
            growth: calculateGrowth(soilWorkCurrentCompleted, soilWorkPreviousCompleted),
            inProgressTasks: soilWorkInProgress.length
          },
          construction: {
            completedTasks: constructionCurrentCompleted.length,
            growth: calculateGrowth(constructionCurrentCompleted, constructionPreviousCompleted),
            inProgressTasks: constructionInProgress.length
          },
          splicing: {
            completedTasks: splicingCurrentCompleted.length,
            growth: calculateGrowth(splicingCurrentCompleted, splicingPreviousCompleted),
            inProgressTasks: splicingInProgress.length
          },
          all: {
            completedTasks: soilWorkCurrentCompleted.length + constructionCurrentCompleted.length + splicingCurrentCompleted.length,
            growth: calculateGrowth(
              [...soilWorkCurrentCompleted, ...constructionCurrentCompleted, ...splicingCurrentCompleted],
              [...soilWorkPreviousCompleted, ...constructionPreviousCompleted, ...splicingPreviousCompleted]
            ),
            inProgressTasks: soilWorkInProgress.length + constructionInProgress.length + splicingInProgress.length
          },
          uniqueTechnicians: technicians,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching monthly stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  return stats;
};