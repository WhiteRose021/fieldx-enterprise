"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEntityIntelligence } from '@/hooks/useEntityIntelligence';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Layout, EntityAnalysis, LayoutType } from '@/types/entity-management';

interface SmartEntityContextType {
  entityType: string | null;
  entityId: string | null;
  entity: any | null;
  layout: Layout | null;
  analysis: EntityAnalysis | null;
  isLoading: boolean;
  error: string | null;
  viewType: LayoutType;
  setViewType: (type: LayoutType) => void;
  loadEntity: (type: string, id: string) => Promise<any>;
  saveEntity: (data: any) => Promise<boolean>;
  deleteEntity: () => Promise<boolean>;
  trackFieldInteraction: (fieldName: string, type: string) => void;
  trackLayoutFeedback: (feedback: 'positive' | 'negative', comments?: string) => void;
}

// Create context with default values
const SmartEntityContext = createContext<SmartEntityContextType>({
  entityType: null,
  entityId: null,
  entity: null,
  layout: null,
  analysis: null,
  isLoading: false,
  error: null,
  viewType: 'detail',
  setViewType: () => {},
  loadEntity: async () => null,
  saveEntity: async () => false,
  deleteEntity: async () => false,
  trackFieldInteraction: () => {},
  trackLayoutFeedback: () => {},
});

interface SmartEntityProviderProps {
  children: ReactNode;
  initialEntityType?: string;
  initialEntityId?: string;
  initialViewType?: LayoutType;
}

export const SmartEntityProvider: React.FC<SmartEntityProviderProps> = ({
  children,
  initialEntityType,
  initialEntityId,
  initialViewType = 'detail',
}) => {
  const { user } = useAuth();
  const [entityType, setEntityType] = useState<string | null>(initialEntityType || null);
  const [entityId, setEntityId] = useState<string | null>(initialEntityId || null);
  const [entity, setEntity] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<LayoutType>(initialViewType);
  
  // Initialize the intelligence hook
  const {
    analysis,
    layout,
    isLoading: isIntelligenceLoading,
    trackFieldInteraction,
    trackLayoutFeedback,
    loadLayoutRecommendation,
  } = useEntityIntelligence({
    entityType: entityType || '',
    layoutType: viewType,
    autoLoad: !!entityType,
  });
  
  // Load entity from API
  const loadEntity = async (type: string, id: string) => {
    setEntityType(type);
    setEntityId(id);
    setError(null);
    
    try {
      const data = await apiClient.get(`/${type}/${id}`);
      setEntity(data);
      return data;
    } catch (err: any) {
      console.error(`Error loading ${type} entity:`, err);
      setError(err.message || `Failed to load ${type} entity`);
      return null;
    }
  };
  
  // Save entity to API
  const saveEntity = async (data: any) => {
    if (!entityType || !entityId) {
      setError('No entity type or ID specified');
      return false;
    }
    
    try {
      await apiClient.put(`/${entityType}/${entityId}`, {
        id: entityId,
        data
      });
      
      // Reload entity
      const updatedEntity = await apiClient.get(`/${entityType}/${entityId}`);
      setEntity(updatedEntity);
      
      return true;
    } catch (err: any) {
      console.error(`Error saving ${entityType} entity:`, err);
      setError(err.message || `Failed to save ${entityType} entity`);
      return false;
    }
  };
  
  // Delete entity from API
  const deleteEntity = async () => {
    if (!entityType || !entityId) {
      setError('No entity type or ID specified');
      return false;
    }
    
    try {
      await apiClient.delete(`/${entityType}/${entityId}`);
      return true;
    } catch (err: any) {
      console.error(`Error deleting ${entityType} entity:`, err);
      setError(err.message || `Failed to delete ${entityType} entity`);
      return false;
    }
  };
  
  // Load layout when view type changes
  useEffect(() => {
    if (entityType) {
      loadLayoutRecommendation(viewType);
    }
  }, [entityType, viewType, loadLayoutRecommendation]);
  
  // Handle field interaction (proxy to intelligence hook)
  const handleTrackFieldInteraction = (fieldName: string, interactionType: string) => {
    if (entityType) {
      trackFieldInteraction(fieldName, interactionType as any);
    }
  };
  
  // Handle layout feedback (proxy to intelligence hook)
  const handleTrackLayoutFeedback = (feedback: 'positive' | 'negative', comments?: string) => {
    if (entityType) {
      trackLayoutFeedback(feedback, comments);
    }
  };
  
  // Load entity if initialEntityType and initialEntityId are provided
  useEffect(() => {
    if (initialEntityType && initialEntityId && !entity) {
      loadEntity(initialEntityType, initialEntityId);
    }
  }, [initialEntityType, initialEntityId]);
  
  const value = {
    entityType,
    entityId,
    entity,
    layout,
    analysis,
    isLoading: isIntelligenceLoading || (!entity && !!entityId),
    error,
    viewType,
    setViewType,
    loadEntity,
    saveEntity,
    deleteEntity,
    trackFieldInteraction: handleTrackFieldInteraction,
    trackLayoutFeedback: handleTrackLayoutFeedback,
  };
  
  return (
    <SmartEntityContext.Provider value={value}>
      {children}
    </SmartEntityContext.Provider>
  );
};

// Custom hook to use the context
export const useSmartEntity = () => {
  const context = useContext(SmartEntityContext);
  
  if (!context) {
    throw new Error('useSmartEntity must be used within a SmartEntityProvider');
  }
  
  return context;
};

export default SmartEntityContext;