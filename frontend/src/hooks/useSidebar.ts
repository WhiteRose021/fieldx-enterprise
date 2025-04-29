"use client";

import { useState, useEffect, useRef } from "react";
import useLocalStorage from "./useLocalStorage";
import sidebarSyncService, { SidebarState } from "@/services/sidebarSyncService";

interface UseSidebarResult {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleCollapse: () => void;
  isGroupOpen: (groupName: string) => boolean;
  toggleGroup: (groupName: string) => void;
  sidebarState: SidebarState;
}

const useSidebar = (): UseSidebarResult => {
  // Single source of truth for the sidebar state
  const [sidebarState, setSidebarState] = useLocalStorage<SidebarState>("sidebarState", {
    isCollapsed: false,
    openGroups: {}
  });
  
  // Derived state
  const [sidebarOpen, setSidebarOpenState] = useState(!sidebarState.isCollapsed);
  
  // Reference to prevent circular updates
  const updateRef = useRef(false);
  
  // Sync from storage to state once on mount
  useEffect(() => {
    if (!updateRef.current) {
      updateRef.current = true;
      setSidebarOpenState(!sidebarState.isCollapsed);
    }
  }, [sidebarState.isCollapsed]);

  // Safe wrapper to update the sidebar collapsed state
  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
    
    // Only update localStorage if the value actually changed
    if (sidebarState.isCollapsed === open) {
      setSidebarState(prev => ({
        ...prev,
        isCollapsed: !open
      }));
    }
  };

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    const newOpenState = sidebarState.isCollapsed;
    setSidebarOpen(newOpenState);
  };

  // Check if a group is open
  const isGroupOpen = (groupName: string): boolean => {
    return !!sidebarState.openGroups[groupName];
  };

  // Toggle a sidebar group
  const toggleGroup = (groupName: string) => {
    setSidebarState(prev => ({
      ...prev,
      openGroups: {
        ...prev.openGroups,
        [groupName]: !prev.openGroups[groupName]
      }
    }));
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleCollapse,
    isGroupOpen,
    toggleGroup,
    sidebarState
  };
};

export default useSidebar;