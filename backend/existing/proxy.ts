// services/existing/proxy.ts
import { api } from "encore.dev/api";
import { getClient } from "./client";

export interface ProxyRequest {
  url: string;
  method: string;
  data?: any;
}

export interface ProxyResponse {
  data: any;
  error?: string;
}

// Generic proxy endpoint to access any EspoCRM API
export const proxyRequest = api(
  { expose: true, method: "POST", path: "/proxy" },
  async (req: ProxyRequest): Promise<ProxyResponse> => {
    try {
      const client = getClient();
      const result = await client.request(req.method, req.url, req.data);
      return { data: result };
    } catch (error) {
      console.error('Proxy request error:', error);
      // Return a structured error response
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to proxy request to EspoCRM'
      };
    }
  }
);