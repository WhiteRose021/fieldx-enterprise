// contexts/SettingsContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  activeEntityId: string | null;
  setActiveEntityId: (id: string | null) => void;
  unsavedChanges: boolean;
  setUnsavedChanges: (hasChanges: boolean) => void;
  // Add more settings state as needed
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  return (
    <SettingsContext.Provider value={{
      activeEntityId,
      setActiveEntityId,
      unsavedChanges,
      setUnsavedChanges,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}