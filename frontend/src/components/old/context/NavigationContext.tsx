"use client";

import React, { createContext, useContext, useState } from "react";

interface Tab {
  name: string;
  path: string;
}

interface NavigationContextType {
  tabs: Tab[];
  currentTab: Tab | null;
  openTab: (tab: Tab) => void;
  closeTab: (path: string) => void;
  switchTab: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab | null>(null);

  const openTab = (tab: Tab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.path === tab.path);
      if (!exists) {
        return [...prev, tab];
      }
      return prev;
    });
    setCurrentTab(tab);
  };

  const closeTab = (path: string) => {
    setTabs((prev) => prev.filter((tab) => tab.path !== path));
    setCurrentTab((prev) => (prev?.path === path ? null : prev));
  };

  const switchTab = (path: string) => {
    const tab = tabs.find((t) => t.path === path);
    if (tab) setCurrentTab(tab);
  };

  return (
    <NavigationContext.Provider
      value={{ tabs, currentTab, openTab, closeTab, switchTab }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
