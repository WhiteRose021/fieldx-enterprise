// shared/types.ts
// Base entity interface
export interface Entity {
    id: string;
    createdAt?: string;
    modifiedAt?: string;
  }
  
  // Pagination parameters
  export interface ListParams {
    offset?: number;
    maxSize?: number;
    orderBy?: string;
    order?: "asc" | "desc";
    where?: Record<string, any>;
  }
  
  // List response format
  export interface ListResponse<T> {
    list: T[];
    total: number;
  }
  
  // User entity
  export interface User extends Entity {
    userName: string;
    name: string;
    emailAddress?: string;
    isActive?: boolean;
    type?: string;
  }
  
  // Team entity
  export interface Team extends Entity {
    name: string;
    isActive?: boolean;
  }
  
  // Role entity
  export interface Role extends Entity {
    name: string;
    assignmentPermission?: string;
    data?: Record<string, any>;
  }
  
  // Account entity
  export interface Account extends Entity {
    name: string;
    website?: string;
    type?: string;
    industry?: string;
  }
  
  // Contact entity
  export interface Contact extends Entity {
    name: string;
    emailAddress?: string;
    phoneNumber?: string;
    accountId?: string;
  }
  
  // Metadata types
  export interface EntityMetadata {
    fields: Record<string, FieldMetadata>;
    links: Record<string, LinkMetadata>;
    labels: Record<string, string>;
    layouts?: Record<string, any>;
  }
  
  export interface FieldMetadata {
    type: string;
    required: boolean;
    readOnly: boolean;
    options?: string[];
    default?: any;
    label?: string;
  }
  
  export interface LinkMetadata {
    type: string;
    entity: string;
    foreign?: string;
  }
  
  // Application configuration
  export interface AppConfig {
    id?: string;
    espoCrmUrl: string;
    apiKey?: string;
    theme?: string;
  }
  
  // User preferences
  export interface UserPreference {
    id?: string;
    userId: string;
    dashboard?: string; // JSON string of dashboard layout
    theme?: string;
    language?: string;
  }