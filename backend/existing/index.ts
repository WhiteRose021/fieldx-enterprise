// services/existing/index.ts
import { api } from "encore.dev/api";

// Define and export the existing service
const existing = {
  name: "existing"
};

export default existing;

// Make sure you re-export all components
export * from './autopsies';
export * from './client';
export * from './config';
export * from './constructions';
export * from './entities';
export * from '../metadata';
export * from './operations';
export * from './permissions';
export * from './proxy';
export * from './settings';
export * from './splicings';
