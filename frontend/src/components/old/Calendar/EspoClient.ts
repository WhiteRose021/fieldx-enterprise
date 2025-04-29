export class EspoClient {
  private url: string;
  private apiKey: string;
  private urlPath: string = '/api/v1/';

  constructor(url: string, apiKey: string) {
    this.url = url.endsWith('/') ? url.slice(0, -1) : url;
    this.apiKey = apiKey;
  }

  async request(method: string, action: string, data?: any) {
    const headers = {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    let url = this._buildUrl(action);
    if (method === 'GET' && data) {
      const params = new URLSearchParams({ searchParams: JSON.stringify(data) });
      url += '?' + params.toString();
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private _buildUrl(action: string): string {
    return this.url + this.urlPath + action;
  }
}