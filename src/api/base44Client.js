import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required using environment variables
export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  apiUrl: import.meta.env.VITE_BASE44_API_URL,
  requiresAuth: import.meta.env.VITE_BASE44_REQUIRES_AUTH === 'true'
});

// Export the client for use in other modules
export default base44;
