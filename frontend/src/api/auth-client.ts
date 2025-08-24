import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState, useMemo } from 'react';
import type { Subscription, Analytics } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createAuthenticatedApi = (accessToken?: string): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // Debug: verify the API instance has the required methods
  console.log('Created API instance:', { 
    baseURL: api.defaults.baseURL, 
    hasPost: typeof api.post === 'function',
    hasGet: typeof api.get === 'function',
    hasToken: !!accessToken,
    tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
    headers: api.defaults.headers
  });

  // Add response interceptor for better error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
        url: error.config?.url,
        hasAuth: !!error.config?.headers?.Authorization
      });
      return Promise.reject(error);
    }
  );

  return api;
};

export const useAuthenticatedApi = () => {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    const updateToken = async () => {
      // Don't update token if Auth0 is still loading
      if (isLoading) {
        setIsTokenReady(false);
        return;
      }
      
      try {
        if (isAuthenticated) {
          console.log('User is authenticated, getting access token...');
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: 'openid profile email read:subscriptions write:subscriptions',
            },
          });
          console.log('Got access token');
          setAccessToken(token);
          setIsTokenReady(true);
        } else {
          console.log('User not authenticated');
          setAccessToken(undefined);
          setIsTokenReady(true); // Ready even without token for non-auth mode
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
        setAccessToken(undefined);
        setIsTokenReady(true); // Ready even if token fetch failed
      }
    };

    updateToken();
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  // Create stable API instance using useMemo
  const api = useMemo(() => createAuthenticatedApi(accessToken), [accessToken]);

  return {
    isTokenReady,
    // Add health check
    health: {
      check: async () => {
        const response = await api.get('/');
        return response.data;
      }
    },

    subscriptions: {
      getAll: async (): Promise<Subscription[]> => {
        const response = await api.get('/subscriptions');
        return response.data;
      },

      create: async (subscription: Omit<Subscription, 'id'>): Promise<Subscription> => {
        // Debug logging
        console.log('Creating subscription with API:', { 
          hasApi: !!api, 
          hasPost: !!api?.post,
          isAuthenticated,
          hasToken: !!accessToken 
        });
        console.log('Subscription data:', subscription);
        
        // Frontend and backend now use the same string format for service_id
        const backendData = {
          ...subscription,
        };
        
        const response = await api.post('/subscriptions', backendData);
        return response.data;
      },

      update: async (id: string, subscription: Partial<Subscription>): Promise<Subscription> => {
        // Frontend and backend now use the same string format for service_id
        const backendData = {
          ...subscription,
        };
        const response = await api.put(`/subscriptions/${id}`, backendData);
        return response.data;
      },

      delete: async (id: string): Promise<void> => {
        await api.delete(`/subscriptions/${id}`);
      },

      parseNLP: async (text: string) => {
        const response = await api.post('/subscriptions/nlp', { text });
        return response.data; // Return the full NLPSubscriptionResponse
      },

      parseNLPWithImage: async (text: string, imageBase64: string) => {
        const response = await api.post('/subscriptions/nlp-multimodal', { 
          text, 
          image: imageBase64 
        });
        return response.data; // Return the full NLPSubscriptionResponse
      },
    },

    analytics: {
      get: async (): Promise<Analytics> => {
        const response = await api.get('/analytics');
        const backendData = response.data;
        
        // Convert backend MonthlyTrend to frontend MonthlySpending format
        const convertedData = {
          ...backendData,
          monthly_trend: backendData.monthly_trend.map((item: any) => ({
            month: item.month,
            year: new Date().getFullYear(), // Use current year
            projected: item.total,
            actual: undefined // Backend doesn't provide actual data yet
          }))
        };
        
        return convertedData;
      },
    },
  };
};