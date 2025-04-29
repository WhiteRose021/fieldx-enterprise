// src/types/api.ts

export type ApiResponse<T> = {
    total?: number;
    list?: T[];
  } | T;
  
  export interface ApiListResponse<T> {
    total: number;
    list: T[];
  }
  
  export interface AppointmentSearchParams {
    where: Array<{
      type: string;
      attribute: string;
      value: string;
    }>;
    offset: number;
    maxSize: number;
  }
  
  export interface Attachment {
    id: string;
    name: string;
    url: string;
    type?: string;
    size?: number;
    createdAt?: string;
  }