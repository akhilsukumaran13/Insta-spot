import { mockBackend } from './mock-backend';

// Toggle this to switch between Real and Mock API
// For standalone APK builds, this should be true
const USE_MOCK_API = true;

export const getApiUrl = (endpoint: string) => {
  // If using mock API, the URL doesn't matter much, but we keep it consistent
  if (USE_MOCK_API) return endpoint;
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  if (endpoint.startsWith('http')) return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  if (USE_MOCK_API) {
    console.log(`[Mock API Request] ${options.method || 'GET'} ${endpoint}`);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const response = await mockBackend.handleRequest(
        options.method || 'GET',
        endpoint,
        options.body ? JSON.parse(options.body as string) : undefined
      );
      
      return {
        ok: true,
        json: async () => response
      };
    } catch (error: any) {
      console.error('[Mock API Error]', error);
      return {
        ok: false,
        json: async () => ({ error: error.message || 'Unknown error' })
      };
    }
  }

  // Real API Request
  const url = getApiUrl(endpoint);
  return fetch(url, options);
};
