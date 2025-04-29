// src/components/LayoutManager/types.ts
export interface FieldConfig {
    id: string;
    label: string;
    enabled: boolean;
    order: number;
    width?: string;
    type: 'text' | 'status' | 'link' | 'email' | 'phone';
    field: string; // This will map to your actual field name in the API
  }
  
  export interface EntityLayout {
    entityType: string; // e.g., 'Aytopsies1'
    viewType: 'list' | 'detail';
    fields: FieldConfig[];
  }