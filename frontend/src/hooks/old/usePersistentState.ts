"use client";

import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T) {
  // Always initialize with defaultValue to ensure consistent server/client render
  const [state, setState] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted value after mount
  useEffect(() => {
    try {
      const savedValue = localStorage.getItem(key);
      if (savedValue) {
        const parsedValue = JSON.parse(savedValue);
        setState(parsedValue);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error(`Error loading persisted state for key "${key}":`, error);
      setIsInitialized(true);
    }
  }, [key]);

  // Save to localStorage whenever state changes, but only after initial load
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error saving persisted state for key "${key}":`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState] as const;
}

export default usePersistentState;