// services/existing/config.ts
import { secret } from "encore.dev/config";

export interface EntityConfig {
  enabled: boolean;
  endpoints: string[];
  // Add mapping for entities that have different names in EspoCRM
  espoCrmEntityName?: string;
}

export interface EspoCRMConfig {
  url: string;
  baseUrl: string;
  apiKey: () => string;
  entities: Record<string, EntityConfig>;
}

// Define which entities to expose and how
export const espoCRMConfig: EspoCRMConfig = {
  baseUrl: process.env.ESPOCRM_URL || "http://192.168.4.150:8080",
  apiKey: secret("EspoCRMAPIKey"),
  entities: {
    User: {
      enabled: true,
      endpoints: ["list", "detail", "create", "update", "delete"]
    },
    Team: {
      enabled: true,
      endpoints: ["list", "detail", "create", "update", "delete"]
    },
    // Here we map our proper name to the actual EspoCRM entity name
    Autopsies: {
      enabled: true,
      endpoints: ["list", "detail", "create", "update", "delete"],
      espoCrmEntityName: "Aytopsies1" // This is the actual entity name in EspoCRM
    },
    Account: {
      enabled: false,
      endpoints: ["list", "detail"]
    },
    Contact: {
      enabled: false,
      endpoints: ["list", "detail"]
    },
    Constructions: {
      enabled: true,
      endpoints: ["list", "detail", "create", "update", "delete"],
      espoCrmEntityName: "KataskeyesBFasi" // Map to actual EspoCRM entity name
    },
    // Add more entities as needed
  },
  url: ""
};

// Helper function to get the actual EspoCRM entity name
export function getEspoCrmEntityName(entityName: string): string {
  return espoCRMConfig.entities[entityName]?.espoCrmEntityName || entityName;
}

// Helper function to validate and get API key
export function getApiKey(): string {
  const apiKey = espoCRMConfig.apiKey();
  if (!apiKey) {
    throw new Error("API Key is empty or undefined");
  }
  return apiKey;
}