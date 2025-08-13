import axios from 'axios';
import type { Subscription, Analytics } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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