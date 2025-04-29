import { api } from "encore.dev/api";
import { getClient } from "./client";
import { RedisService } from "../core/redis";
import { resolveEntityName } from "../metadata/entitiesMap";

// Initialize Redis service
const redis = RedisService.getInstance();

// Cache keys and TTL
const ENTITY_DEF_CACHE_KEY = (entity: string) => `metadata:entity:${entity}:def`;
const CLIENT_DEF_CACHE_KEY = (entity: string) => `metadata:entity:${entity}:clientdef`;
const METADATA_CACHE_TTL = 3600; // 1 hour - metadata changes rarely

// Define response interfaces
export interface EntityMetadata {
  entityDef: Record<string, any>;
  clientDef: Record<string, any>;
}

// Fixed FieldDefinition without index signature
export interface FieldDefinition {
  type: string;
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  default?: any;
  readOnlyAfterCreate?: boolean;
  isCustom?: boolean;
  view?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  notNull?: boolean;
  style?: Record<string, any>;
  // Removed the index signature [key: string]: any
  // Instead, add specific additional properties that might be encountered
  tooltip?: string;
  audited?: boolean;
  trim?: boolean;
  pattern?: string;
  inlineEditDisabled?: boolean;
  disabled?: boolean;
  prohibitedEmptyValue?: boolean;
  useNumericGroupSeparator?: boolean;
  valueMap?: Record<string, string>;
  optionsPath?: string;
}

// Additional type for when we need to handle unknown fields
export type FieldDefinitionWithExtras = FieldDefinition & Record<string, any>;

export interface EntityDefinition {
  fields: Record<string, FieldDefinition>;
  links: Record<string, any>;
  collection?: Record<string, any>;
  indexes?: Record<string, any>;
}

export interface ClientDefinition {
  controller?: string;
  recordViews?: Record<string, string>;
  dynamicLogic?: Record<string, any>;
  color?: string;
  iconClass?: string;
  kanbanViewMode?: boolean;
  boolFilterList?: string[];
  filterList?: any[];
  relationshipPanels?: Record<string, any>;
}

// Get metadata for a specific entity type
export const getEntityMetadata = api(
  { expose: true, method: "GET", path: "/metadata/:entity" },
  async ({ entity }: { entity: string }): Promise<EntityMetadata> => {
    try {
      const cachedEntityDef = await redis.get<Record<string, any>>(ENTITY_DEF_CACHE_KEY(entity));
      const cachedClientDef = await redis.get<Record<string, any>>(CLIENT_DEF_CACHE_KEY(entity));

      if (cachedEntityDef && cachedClientDef) {
        console.log("Serving metadata for", entity, "from cache");
        return {
          entityDef: cachedEntityDef,
          clientDef: cachedClientDef
        };
      }

      const client = getClient();
      const fullMetadata = await client.request("GET", "Metadata");

      console.log("EspoCRM metadata keys:");
      console.log("entityDefs:", Object.keys(fullMetadata.entityDefs || {}));
      console.log("clientDefs:", Object.keys(fullMetadata.clientDefs || {}));
      console.log("Requested entity:", entity);

      const entityDef = fullMetadata?.entityDefs?.[entity];
      const clientDef = fullMetadata?.clientDefs?.[entity];

      if (!entityDef || !clientDef) {
        throw new Error(`Metadata for entity "${entity}" not found. entityDef=${!!entityDef}, clientDef=${!!clientDef}`);
      }

      await redis.set(ENTITY_DEF_CACHE_KEY(entity), entityDef, METADATA_CACHE_TTL);
      await redis.set(CLIENT_DEF_CACHE_KEY(entity), clientDef, METADATA_CACHE_TTL);

      return { entityDef, clientDef };
    } catch (error) {
      console.error(`Error fetching metadata for entity "${entity}":`, error);
      throw error;
    }
  }
);

// Get available entity types
export const getEntityTypes = api(
  { expose: true, method: "GET", path: "/metadata/entity-types" },
  async (): Promise<{ types: string[] }> => {
    const cacheKey = "metadata:entity-types";
    const redis = RedisService.getInstance();

    const cached = await redis.get<{ types: string[] }>(cacheKey);
    if (cached) return cached;

    const client = getClient();
    const scopes = await client.request("GET", "Metadata/scopes");

    const types = Object.keys(scopes).filter(key => {
      const scope = scopes[key];
      return (
        scope.entity === true ||
        scope.object === 'Entity' ||
        scope.object === 'BasePlus' ||
        scope.object === 'Event' ||
        scope.customizable === true
      );
    });

    await redis.set(cacheKey, { types }, 3600);
    return { types };
  }
);


// Force refresh metadata for an entity
export const refreshEntityMetadata = api(
  { expose: true, method: "POST", path: "/metadata/:entity/refresh" },
  async ({ entity }: { entity: string }): Promise<EntityMetadata> => {
    // Delete cached metadata
    await redis.delete(ENTITY_DEF_CACHE_KEY(entity));
    await redis.delete(CLIENT_DEF_CACHE_KEY(entity));
    
    // Re-fetch and return
    return getEntityMetadata({ entity });
  }
);

// Get field definitions for an entity - Fixed return type
export const getEntityFields = api(
  { expose: true, method: "GET", path: "/metadata/:entity/fields" },
  async ({ entity }: { entity: string }): Promise<{ fields: Record<string, FieldDefinition> }> => {
    const cacheKey = `metadata:entity:${entity}:fields`;
    
    // Try to get from cache first
    const cached = await redis.get<{ fields: Record<string, FieldDefinition> }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get full entity metadata
    const { entityDef } = await getEntityMetadata({ entity });
    
    // Extract field definitions
    const fields = entityDef.fields || {};
    
    // Cache results
    await redis.set(cacheKey, { fields }, METADATA_CACHE_TTL);
    
    return { fields };
  }
);

// Get dynamic logic for an entity
export const getEntityDynamicLogic = api(
  { expose: true, method: "GET", path: "/metadata/:entity/dynamic-logic" },
  async ({ entity }: { entity: string }): Promise<{ dynamicLogic: Record<string, any> }> => {
    const cacheKey = `metadata:entity:${entity}:dynamic-logic`;
    
    // Try to get from cache first
    const cached = await redis.get<{ dynamicLogic: Record<string, any> }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get full client metadata
    const { clientDef } = await getEntityMetadata({ entity });
    
    // Extract dynamic logic
    const dynamicLogic = clientDef.dynamicLogic || {};
    
    // Cache results
    await redis.set(cacheKey, { dynamicLogic }, METADATA_CACHE_TTL);
    
    return { dynamicLogic };
  }
);

// Get layouts for an entity
export const getEntityLayouts = api(
  { expose: true, method: "GET", path: "/metadata/:entity/layouts" },
  async ({ entity }: { entity: string }): Promise<{ layouts: Record<string, any> }> => {
    const cacheKey = `metadata:entity:${entity}:layouts`;
    
    // Try to get from cache first
    const cached = await redis.get<{ layouts: Record<string, any> }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get full client metadata
    const { clientDef } = await getEntityMetadata({ entity });
    
    // Extract layouts
    const layouts = clientDef.layouts || {};
    
    // Cache results
    await redis.set(cacheKey, { layouts }, METADATA_CACHE_TTL);
    
    return { layouts };
  }
);

export const getEventEntityTypes = api(
  { expose: true, method: "GET", path: "/metadata/event-entity-types" },
  async (): Promise<{ types: string[] }> => {
    const cacheKey = "metadata:event-entity-types";
    
    // Try to get from cache first
    const cached = await redis.get<{ types: string[] }>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get all entity types
    const { types: allTypes } = await getEntityTypes();
    const eventTypes: string[] = [];
    
    // Check each entity to see if it's an event type
    for (const entityType of allTypes) {
      try {
        const { entityDef, clientDef } = await getEntityMetadata({ entity: entityType });
        
        // Check various indicators that this is a calendar/event entity
        const isEventType = 
          entityDef.isCalendarEntity === true || 
          entityDef.calendar === true ||
          entityDef.object === 'Event' ||
          entityDef.type === 'Event' ||
          clientDef.calendar === true ||
          (entityDef.fields && (
            entityDef.fields.dateStart ||
            (entityDef.fields.date && entityDef.fields.status)
          ));
        
        if (isEventType) {
          eventTypes.push(entityType);
        }
      } catch (error) {
        console.error(`Error checking if ${entityType} is an event entity:`, error);
        // Continue with next entity
      }
    }
    
    // Cache results
    await redis.set(cacheKey, { types: eventTypes }, METADATA_CACHE_TTL);
    
    return { types: eventTypes };
  }
);

export const getEntityMetadataByApiname = api(
  { expose: true, method: "GET", path: "/api/metadata/:apiname" },
  async ({ apiname }: { apiname: string }): Promise<EntityMetadata> => {
    console.log("Requested apiname:", apiname);

    const entity = resolveEntityName(apiname);
    if (!entity) {
      console.error("No mapping found for apiname:", apiname);
      throw new Error(`No entity mapping found for apiname: ${apiname}`);
    }

    console.log("Resolved to entity:", entity);

    const metadata = await getEntityMetadata({ entity });

    console.log("Metadata loaded for entity:", entity);
    return metadata;
  }
);

