// contexts/MaintenanceContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

const MaintenanceContext = createContext<{
  isMaintenanceMode: boolean;
  toggleMaintenanceMode: () => void;
}>({ isMaintenanceMode: false, toggleMaintenanceMode: () => {} });

export const MaintenanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    // Fetch initial maintenance mode state from your API
    const fetchMaintenanceState = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        const data = await response.json();
        setIsMaintenanceMode(data.isMaintenanceMode);
      } catch (error) {
        console.error('Error fetching maintenance state:', error);
      }
    };
    fetchMaintenanceState();
  }, []);

  const toggleMaintenanceMode = async () => {
    try {
      const response = await fetch('/api/maintenance/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setIsMaintenanceMode(data.isMaintenanceMode);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, toggleMaintenanceMode }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenanceMode = () => useContext(MaintenanceContext);