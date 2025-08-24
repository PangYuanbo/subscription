/**
 * API Configuration for different environments
 */

// Modal backend URL
const MODAL_API_URL = 'https://yuanbopang--subscription-manager-fastapi-app.modal.run';

// Local development URL
const LOCAL_API_URL = 'http://localhost:8000';

/**
 * Automatically detect the appropriate API base URL based on environment
 */
export const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || LOCAL_API_URL;
  }

  // Check if we're running on Vercel
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return MODAL_API_URL;
  }

  // Check Vercel environment variables
  if (import.meta.env.VITE_VERCEL_URL || import.meta.env.VERCEL_URL) {
    return MODAL_API_URL;
  }

  // Check if a custom API URL is provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default to Modal for production builds
  if (import.meta.env.PROD) {
    return MODAL_API_URL;
  }

  // Fallback to local development
  return LOCAL_API_URL;
};

/**
 * Get API configuration with logging for debugging
 */
export const getApiConfig = () => {
  const baseURL = getApiBaseUrl();
  
  console.log('API Configuration:', {
    baseURL,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    hasCustomUrl: !!import.meta.env.VITE_API_URL,
    hasVercelUrl: !!(import.meta.env.VITE_VERCEL_URL || import.meta.env.VERCEL_URL),
  });

  return {
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};