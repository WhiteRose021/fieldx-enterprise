// frontend/src/types/entity-management.ts

// Basic Entity interface (replacing the imported one that caused errors)
export interface BaseEntity {
  id: string;
  name?: string;
  [key: string]: any;
}

// Field definitions
export interface FieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  readOnly: boolean;
  visible: boolean;
  options?: FieldOption[];
  default?: any;
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  helpText?: string;
  group?: string;
}

// Layout related types
export interface LayoutField {
  id: string;
  fieldName: string;
  label: string;
  type: string;
  required: boolean;
  readOnly: boolean;
  order: number;
  width: 'full' | 'half' | 'third';
  visible: boolean;
  helpText?: string;
  placeholder?: string;
  defaultValue?: any;
  validation?: any;
  displayCondition?: any;
  fieldGroup?: string;
  options?: FieldOption[];
}

export interface LayoutSection {
  id: string;
  title: string;
  description?: string;
  collapsible: boolean;
  expanded: boolean;
  order: number;
  fields: LayoutField[];
  columns: 1 | 2 | 3;
}

export interface LayoutTab {
  id: string;
  title: string;
  icon?: string;
  order: number;
  sections: LayoutSection[];
}

export type LayoutType = 'list' | 'detail' | 'edit' | 'mobile' | 'print' | 'custom';

export interface Layout {
  id: string;
  entityType: string;
  name: string;
  description?: string;
  type: LayoutType;
  userRole?: string;
  isDefault: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tabs: LayoutTab[];
  settings: any;
}

export interface LayoutRecommendation {
  layout: Layout;
  confidence: number;
  reasoning: string;
  alternativeLayouts?: Layout[];
}

// Entity Metadata
export interface EntityMetadata {
  entityType: string;
  displayName: string;
  fields: Record<string, FieldDefinition>;
  relationships: Record<string, RelationshipDefinition>;
  layouts: Record<string, any>;
  permissions: EntityPermissions;
}

export interface RelationshipDefinition {
  type: 'oneToMany' | 'manyToOne' | 'manyToMany';
  entityType: string;
  field: string;
  foreignField: string;
  label: string;
  displayField?: string;
}

export interface EntityPermissions {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  fields: Record<string, FieldPermission>;
}

export interface FieldPermission {
  read: boolean;
  edit: boolean;
}

// Entity analysis types
export interface FieldAnalysis {
  fieldName: string;
  importance: number;
  fillRate: number;
  dataType: string;
  valueDistribution: any;
  isIdentifier: boolean;
  isCritical: boolean;
  isFrequentlyViewed: boolean;
  isFrequentlyUpdated: boolean;
  related: string[];
  groupSuggestion: string;
  displayPriority: number;
}

export interface EntityAnalysis {
  entityType: string;
  recordCount: number;
  analysisDate: Date;
  fields: Record<string, FieldAnalysis>;
  significantFields: string[];
  suggestedGroups: Record<string, string[]>;
  commonWorkflows: any[];
  viewRecommendations: any;
}

// Dynamic field component props
export interface DynamicFieldProps {
  field: LayoutField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
  onInteraction?: (interactionType: string) => void;
}

// Entity page context
export interface EntityPageContext {
  entityType: string;
  entityId?: string;
  view: 'list' | 'detail' | 'edit' | 'create';
  metadata?: EntityMetadata;
  permissions?: EntityPermissions;
  layout?: Layout;
  isLoading: boolean;
}

// Filter and pagination for list views
export interface EntityListFilters {
  search?: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  pageSize: number;
  page: number;
}

// Entity selection for relationships
export interface EntitySelection {
  id: string;
  name: string;
  entityType: string;
  data?: any;
}

// Validation
export interface ValidationRule {
  type: 'required' | 'email' | 'number' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Field formatters
export interface FieldFormatter {
  format: (value: any, options?: any) => React.ReactNode;
  parse?: (value: string, options?: any) => any;
  options?: any;
}

// Alternative view suggestion
export interface ViewSuggestion {
  id: string;
  name: string;
  description: string;
  confidence: number;
  preview?: string;
  viewType: 'list' | 'detail' | 'edit' | 'mobile' | 'print' | 'custom';
}

// Entity intelligence service interface
export interface EntityIntelligenceService {
  analyzeEntity(entityType: string): Promise<EntityAnalysis>;
  getLayoutRecommendation(
    entityType: string, 
    layoutType: LayoutType, 
    userRole?: string
  ): Promise<LayoutRecommendation>;
  trackFieldInteraction(
    entityType: string,
    fieldName: string,
    interactionType: string
  ): Promise<void>;
  trackLayoutFeedback(
    entityType: string,
    layoutType: string,
    userRole: string,
    feedback: 'positive' | 'negative',
    comments?: string
  ): Promise<void>;
  saveLayout(
    entityType: string,
    layoutType: string,
    layout: Layout,
    isGlobal?: boolean
  ): Promise<void>;
}