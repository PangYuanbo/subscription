import axios from 'axios';
import type { Subscription, Analytics } from '@/types';
import { getApiConfig } from '@/config/api';

const api = axios.create(getApiConfig());

export const subscriptionApi = {
  getAll: async (): Promise<Subscription[]> => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  create: async (subscription: Omit<Subscription, 'id'>): Promise<Subscription> => {
    const response = await api.post('/subscriptions', subscription);
    return response.data;
  },

  update: async (id: string, subscription: Partial<Subscription>): Promise<Subscription> => {
    const response = await api.put(`/subscriptions/${id}`, subscription);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subscriptions/${id}`);
  },

  getAnalytics: async (): Promise<Analytics> => {
    const response = await api.get('/analytics');
    return response.data;
  },
};