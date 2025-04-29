// Replace services/entity-service.ts with this:
import { EntityDefinition, FieldDefinition, LayoutDefinition } from "@/types/entity-management";

export class EntityService {
  /**
   * Get all entity definitions from the API
   */
  static async getEntities(): Promise<EntityDefinition[]> {
    const response = await fetch('/api/metadata/entity-types');
    if (!response.ok) throw new Error(`Failed to fetch entities: ${response.status}`);
    
    const data = await response.json();
    
    // Map the entity types to EntityDefinition objects
    return (data.types || []).map((type: string) => ({
      id: type,
      name: type,
      pluralName: type + 's', // This is simplified
      apiEndpoint: `/api/v1/${type}`,
      displayName: type, // This would be better with a proper display name
      isSystem: ['User', 'Team', 'Role'].includes(type), // Simplified
      isVisible: true
    }));
  }

  /**
   * Get entity by ID from the API
   */
  static async getEntityById(id: string): Promise<EntityDefinition | null> {
    try {
      const response = await fetch(`/api/metadata/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch entity: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the metadata into your EntityDefinition format
      return {
        id: id,
        name: id,
        pluralName: id + 's',
        apiEndpoint: `/api/v1/${id}`,
        displayName: data.clientDef?.label || id,
        description: data.clientDef?.description,
        isSystem: ['User', 'Team', 'Role'].includes(id),
        isVisible: true
      };
    } catch (error) {
      console.error(`Error fetching entity ${id}:`, error);
      return null;
    }
  }

  /**
   * Get fields for an entity from the API
   */
  static async getEntityFields(entityId: string): Promise<FieldDefinition[]> {
    try {
      const response = await fetch(`/api/metadata/${entityId}/fields`);
      if (!response.ok) throw new Error(`Failed to fetch fields: ${response.status}`);
      
      const data = await response.json();
      
      // Transform the field data to your FieldDefinition format
      return Object.entries(data.fields || {}).map(([name, field]: [string, any]) => ({
        id: name,
        entityId: entityId,
        name: name,
        type: field.type,
        label: field.label || name,
        required: field.required || false,
        readOnly: field.readOnly || false,
        searchable: field.isSearchable || true,
        filterable: true, // Assume all fields are filterable
        sortable: true, // Assume all fields are sortable
        options: field.options
      }));
    } catch (error) {
      console.error(`Error fetching fields for entity ${entityId}:`, error);
      return [];
    }
  }

  /**
   * Get layouts for an entity from the API
   */
  static async getEntityLayouts(entityId: string): Promise<LayoutDefinition[]> {
    try {
      const response = await fetch(`/api/metadata/${entityId}/layouts`);
      if (!response.ok) throw new Error(`Failed to fetch layouts: ${response.status}`);
      
      const data = await response.json();
      
      // Convert layouts to your LayoutDefinition format
      return Object.entries(data.layouts || {}).map(([name, layout]: [string, any]) => ({
        id: `${entityId}-${name}`,
        entityId: entityId,
        name: name,
        type: name.includes('list') ? 'list' : name.includes('detail') ? 'detail' : 'edit',
        isDefault: true,
        data: layout
      }));
    } catch (error) {
      console.error(`Error fetching layouts for entity ${entityId}:`, error);
      return [];
    }
  }
}