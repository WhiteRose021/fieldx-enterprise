// services/metadata/index.ts
import { api } from "encore.dev/api";

// Define and export the metadata service
const metadata = {
  name: "metadata"
};

export default metadata;

// Re-export the components
export * from './entitiesMap';