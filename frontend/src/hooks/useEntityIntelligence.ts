// frontend/src/hooks/useEntityIntelligence.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  EntityAnalysis, 
  LayoutRecommendation, 
  Layout,
  LayoutType
} from '@/types/entity-management';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UseEntityIntelligenceOptions {
  entityType: string;
  layoutType?: LayoutType;
  autoLoad?: boolean;
}

/**
 * Hook for working with the entity intelligence system
 */
export function useEntityIntelligence({
  entityType,
  layoutType = 'detail',
  autoLoad = true
}: UseEntityIntelligenceOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<EntityAnalysis | null>(null);
  const [layoutRecommendation, setLayoutRecommendation] = useState<LayoutRecommendation | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [isLoadingLayout, setIsLoadingLayout] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load entity analysis
  const loadAnalysis = useCallback(async () => {
    if (!entityType) return;
    
    setIsLoadingAnalysis(true);
    setError(null);
    
    try {
      const response = await apiClient.get<EntityAnalysis>(`/intelligence/analyze/${entityType}`);
      if (response) {
        setAnalysis(response);
      }
    } catch (err: any) {
      console.error('Error loading entity analysis:', err);
      setError(err.message || 'Failed to load entity analysis');
      toast({
        title: 'Error',
        description: 'Failed to load entity analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [entityType, toast]);
  
  // Load layout recommendation
  const loadLayoutRecommendation = useCallback(async (type: LayoutType = layoutType) => {
    if (!entityType) return null;
    
    setIsLoadingLayout(true);
    setError(null);
    
    try {
      const response = await apiClient.get<LayoutRecommendation>(`/intelligence/layouts/${entityType}`, {
        layoutType: type,
        userRole: user?.role || 'default',
      });
      
      if (response) {
        setLayoutRecommendation(response);
        return response;
      }
      return null;
    } catch (err: any) {
      console.error('Error loading layout recommendation:', err);
      setError(err.message || 'Failed to load layout recommendation');
      toast({
        title: 'Error',
        description: 'Failed to load layout recommendation',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoadingLayout(false);
    }
  }, [entityType, layoutType, user, toast]);
  
  // Track field interaction
  const trackFieldInteraction = useCallback(async (
    fieldName: string, 
    interactionType: 'view' | 'edit' | 'filter' | 'sort'
  ) => {
    if (!entityType || !fieldName) return;
    
    try {
      await apiClient.post('/intelligence/track-interaction', {
        entityType,
        fieldName,
        interactionType,
      });
    } catch (err) {
      // Silently fail - tracking is non-critical
      console.debug('Error tracking field interaction:', err);
    }
  }, [entityType]);
  
  // Track layout feedback
  const trackLayoutFeedback = useCallback(async (
    feedback: 'positive' | 'negative',
    comments?: string
  ) => {
    if (!entityType || !layoutRecommendation) return;
    
    try {
      await apiClient.post('/intelligence/layout-feedback', {
        entityType,
        layoutType,
        userRole: user?.role || 'default',
        feedback,
        comments,
      });
      
      // Show success message
      toast({
        title: 'Thank you for your feedback',
        description: 'Your feedback helps improve the system',
      });
    } catch (err) {
      // Silently fail - feedback is non-critical
      console.debug('Error tracking layout feedback:', err);
    }
  }, [entityType, layoutType, layoutRecommendation, user, toast]);
  
  // Save layout
  const saveLayout = useCallback(async (
    layout: Layout,
    isGlobal: boolean = false
  ) => {
    if (!entityType || !layout) return;
    
    try {
      await apiClient.post(`/intelligence/layouts/${entityType}/save`, {
        layoutType: layout.type,
        layout,
        isGlobal,
      });
      
      // Show success message
      toast({
        title: 'Layout saved',
        description: `The ${layout.type} layout for ${entityType} has been saved`,
      });
      
      // Reload layout recommendation to get the latest version
      await loadLayoutRecommendation(layout.type);
      
      return true;
    } catch (err: any) {
      console.error('Error saving layout:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to save layout',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [entityType, loadLayoutRecommendation, toast]);
  
  // Get alternative views
  const getAlternativeViews = useCallback(async () => {
    if (!entityType) return [];
    
    try {
      const results = [];
      
      // Get detail layout
      const detailRecommendation = await loadLayoutRecommendation('detail');
      if (detailRecommendation) {
        results.push({
          id: 'detail',
          layout: detailRecommendation.layout,
          confidence: detailRecommendation.confidence || 0,
          description: 'Detailed view of the record',
        });
      }
      
      // Get list layout 
      const listRecommendation = await loadLayoutRecommendation('list');
      if (listRecommendation) {
        results.push({
          id: 'list',
          layout: listRecommendation.layout,
          confidence: listRecommendation.confidence || 0,
          description: 'List view showing multiple records',
        });
      }
      
      // Get mobile layout
      const mobileRecommendation = await loadLayoutRecommendation('mobile');
      if (mobileRecommendation) {
        results.push({
          id: 'mobile',
          layout: mobileRecommendation.layout,
          confidence: mobileRecommendation.confidence || 0,
          description: 'Mobile-optimized view',
        });
      }
      
      return results;
    } catch (err) {
      console.error('Error getting alternative views:', err);
      return [];
    }
  }, [entityType, loadLayoutRecommendation]);
  
  // Load data on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad && entityType) {
      loadAnalysis();
      loadLayoutRecommendation();
    }
  }, [autoLoad, entityType, loadAnalysis, loadLayoutRecommendation]);
  
  return {
    analysis,
    layoutRecommendation,
    layout: layoutRecommendation?.layout || null,
    isLoadingAnalysis,
    isLoadingLayout,
    isLoading: isLoadingAnalysis || isLoadingLayout,
    error,
    loadAnalysis,
    loadLayoutRecommendation,
    trackFieldInteraction,
    trackLayoutFeedback,
    saveLayout,
    getAlternativeViews,
  };
}