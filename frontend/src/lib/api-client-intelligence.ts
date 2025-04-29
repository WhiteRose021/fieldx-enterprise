// frontend/lib/api-client-intelligence.ts
// This file extends the functionality of the base api-client.ts

import { ApiClient } from './api-client';
import {
  EntityAnalysis,
  LayoutRecommendation,
  Layout
} from '@/types/entity-management';

/**
 * Extended API client with intelligence services
 */
export class IntelligenceApiClient extends ApiClient {
  /**
   * Get entity analysis
   */
  async analyzeEntity(entityType: string): Promise<EntityAnalysis> {
    return this.get<EntityAnalysis>(`/intelligence/analyze/${entityType}`);
  }

  /**
   * Get layout recommendation for an entity
   */
  async getLayoutRecommendation(
    entityType: string,
    layoutType: string = 'detail',
    userRole: string = 'default'
  ): Promise<LayoutRecommendation> {
    return this.get<LayoutRecommendation>(`/intelligence/layouts/${entityType}`, {
      layoutType,
      userRole,
    });
  }

  /**
   * Track field interaction
   */
  async trackFieldInteraction(
    entityType: string,
    fieldName: string,
    interactionType: 'view' | 'edit' | 'filter' | 'sort'
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/intelligence/track-interaction', {
      entityType,
      fieldName,
      interactionType,
    });
  }

  /**
   * Track layout feedback
   */
  async trackLayoutFeedback(
    entityType: string,
    layoutType: string,
    userRole: string,
    feedback: 'positive' | 'negative',
    comments?: string
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/intelligence/layout-feedback', {
      entityType,
      layoutType,
      userRole,
      feedback,
      comments,
    });
  }

  /**
   * Save layout configuration
   */
  async saveLayout(
    entityType: string,
    layoutType: string,
    layout: Layout,
    isGlobal: boolean = false
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/intelligence/layouts/${entityType}/save`, {
      layoutType,
      layout,
      isGlobal,
    });
  }

  /**
   * Get entity patterns
   * Identifies common patterns and correlations in entity data
   */
  async getEntityPatterns(entityType: string): Promise<any> {
    return this.get<any>(`/intelligence/patterns/${entityType}`);
  }

  /**
   * Get field importance
   * Gets the relative importance of fields for an entity type
   */
  async getFieldImportance(entityType: string): Promise<Record<string, number>> {
    const analysis = await this.analyzeEntity(entityType);
    
    const fieldImportance: Record<string, number> = {};
    
    // Extract importance scores from analysis
    Object.entries(analysis.fields || {}).forEach(([fieldName, field]) => {
      fieldImportance[fieldName] = field.importance || 0;
    });
    
    return fieldImportance;
  }

  /**
   * Get suggested entity groups
   * Gets logically grouped fields for better UI organization
   */
  async getSuggestedGroups(entityType: string): Promise<Record<string, string[]>> {
    const analysis = await this.analyzeEntity(entityType);
    return analysis.suggestedGroups || {};
  }

  /**
   * Get optimal view type
   * Determines the best view type for a specific entity record
   */
  async getOptimalViewType(entityType: string, entityId: string): Promise<string> {
    try {
      // Get entity details
      const entity = await this.getEntity(entityType, entityId);
      
      // Get entity analysis
      const analysis = await this.analyzeEntity(entityType);
      
      // Default view type
      let viewType = 'detail';
      
      // Check for view-specific features
      if (analysis.viewRecommendations) {
        // Map view available if entity has coordinates
        if (analysis.viewRecommendations.mapView?.enabled &&
            entity.latitude && entity.longitude) {
          viewType = 'map';
        }
        
        // Calendar view available if entity has date fields
        if (analysis.viewRecommendations.calendarView?.enabled) {
          viewType = 'calendar';
        }
        
        // Kanban view available if entity has status field
        if (analysis.viewRecommendations.kanbanView?.enabled &&
            entity.status) {
          viewType = 'kanban';
        }
      }
      
      return viewType;
    } catch (error) {
      console.error('Error determining optimal view type:', error);
      return 'detail'; // Default fallback
    }
  }
  
  /**
   * Get field relationships
   * Gets relationships between fields
   */
  async getFieldRelationships(entityType: string): Promise<Record<string, string[]>> {
    const analysis = await this.analyzeEntity(entityType);
    
    const relationships: Record<string, string[]> = {};
    
    // Extract relationships from analysis
    Object.entries(analysis.fields || {}).forEach(([fieldName, field]) => {
      relationships[fieldName] = field.related || [];
    });
    
    return relationships;
  }
  
  /**
   * Get value distribution for a field
   */
  async getFieldValueDistribution(entityType: string, fieldName: string): Promise<Record<string, number>> {
    const analysis = await this.analyzeEntity(entityType);
    return analysis.fields?.[fieldName]?.valueDistribution || {};
  }
}

// Export a singleton instance
export const intelligenceClient = new IntelligenceApiClient();

// Extend the existing apiClient with intelligence methods
import { apiClient } from './api-client';

// Add intelligence methods to the main apiClient
Object.assign(apiClient, {
  analyzeEntity: intelligenceClient.analyzeEntity.bind(intelligenceClient),
  getLayoutRecommendation: intelligenceClient.getLayoutRecommendation.bind(intelligenceClient),
  trackFieldInteraction: intelligenceClient.trackFieldInteraction.bind(intelligenceClient),
  trackLayoutFeedback: intelligenceClient.trackLayoutFeedback.bind(intelligenceClient),
  saveLayout: intelligenceClient.saveLayout.bind(intelligenceClient),
  getEntityPatterns: intelligenceClient.getEntityPatterns.bind(intelligenceClient),
  getFieldImportance: intelligenceClient.getFieldImportance.bind(intelligenceClient),
  getSuggestedGroups: intelligenceClient.getSuggestedGroups.bind(intelligenceClient),
  getOptimalViewType: intelligenceClient.getOptimalViewType.bind(intelligenceClient),
  getFieldRelationships: intelligenceClient.getFieldRelationships.bind(intelligenceClient),
  getFieldValueDistribution: intelligenceClient.getFieldValueDistribution.bind(intelligenceClient),
});