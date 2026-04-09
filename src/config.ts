// Configuration for API Base URL
// When running the app on a mobile device (via APK), this must point to your computer's local IP address.
// Example: 'http://192.168.1.5:3000'
// When running in a browser on the same machine, it can be empty (relative path).

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const getApiUrl = (endpoint: string) => {
  // If it's an absolute URL (http/https), return as is
  if (endpoint.startsWith('http')) return endpoint;
  
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};
