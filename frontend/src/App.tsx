import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionForm from '@/components/SubscriptionForm';
import Analytics from '@/components/Analytics';
import { Subscription, Analytics as AnalyticsData } from '@/types';
import { subscriptionApi } from '@/api/client';

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    service_id: '1',
    service: { id: '1', name: 'Netflix', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/netflix/netflix-original.svg', category: 'Entertainment' },
    account: 'family@example.com',
    payment_date: '2024-01-15',
    monthly_cost: 19.99,
  },
  {
    id: '2',
    service_id: '2',
    service: { id: '2', name: 'Spotify', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spotify/spotify-original.svg', category: 'Entertainment' },
    account: 'user@example.com',
    payment_date: '2024-01-10',
    monthly_cost: 9.99,
  },
  {
    id: '3',
    service_id: '3',
    service: { id: '3', name: 'GitHub', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', category: 'Development' },
    account: 'dev@example.com',
    payment_date: '2024-01-01',
    monthly_cost: 7.00,
  },
  {
    id: '4',
    service_id: '4',
    service: { id: '4', name: 'AWS', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg', category: 'Cloud' },
    account: 'admin@company.com',
    payment_date: '2024-01-01',
    monthly_cost: 150.00,
  },
];

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [useApi, setUseApi] = useState(false);

  useEffect(() => {
    loadData();
  }, [useApi]);

  const loadData = async () => {
    if (useApi) {
      try {
        const [subs, analyticsData] = await Promise.all([
          subscriptionApi.getAll(),
          subscriptionApi.getAnalytics(),
        ]);
        setSubscriptions(subs);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load data from API, using mock data', error);
        loadMockData();
      }
    } else {
      loadMockData();
    }
  };

  const loadMockData = () => {
    const storedSubs = localStorage.getItem('subscriptions');
    if (storedSubs) {
      setSubscriptions(JSON.parse(storedSubs));
    } else {
      setSubscriptions(MOCK_SUBSCRIPTIONS);
      localStorage.setItem('subscriptions', JSON.stringify(MOCK_SUBSCRIPTIONS));
    }
    calculateAnalytics(storedSubs ? JSON.parse(storedSubs) : MOCK_SUBSCRIPTIONS);
  };

  const calculateAnalytics = (subs: Subscription[]) => {
    const totalMonthly = subs.reduce((sum, sub) => sum + sub.monthly_cost, 0);
    const categoryBreakdown = subs.reduce((acc, sub) => {
      const category = sub.service?.category || 'Other';
      const existing = acc.find(c => c.category === category);
      if (existing) {
        existing.total += sub.monthly_cost;
      } else {
        acc.push({ category, total: sub.monthly_cost });
      }
      return acc;
    }, [] as { category: string; total: number }[]);

    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(2024, i).toLocaleString('default', { month: 'short' });
      return { month, total: totalMonthly * (0.8 + Math.random() * 0.4) };
    });

    setAnalytics({
      total_monthly_cost: totalMonthly,
      total_annual_cost: totalMonthly * 12,
      category_breakdown: categoryBreakdown,
      monthly_trend: monthlyTrend,
      service_count: subs.length,
    });
  };

  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setIsFormOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsFormOpen(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      if (useApi) {
        try {
          await subscriptionApi.delete(id);
          await loadData();
        } catch (error) {
          console.error('Failed to delete subscription', error);
        }
      } else {
        const updatedSubs = subscriptions.filter(sub => sub.id !== id);
        setSubscriptions(updatedSubs);
        localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
        calculateAnalytics(updatedSubs);
      }
    }
  };

  const handleSubmitSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
    if (useApi) {
      try {
        if (editingSubscription) {
          await subscriptionApi.update(editingSubscription.id, subscriptionData);
        } else {
          await subscriptionApi.create(subscriptionData);
        }
        await loadData();
      } catch (error) {
        console.error('Failed to save subscription', error);
      }
    } else {
      let updatedSubs: Subscription[];
      if (editingSubscription) {
        updatedSubs = subscriptions.map(sub =>
          sub.id === editingSubscription.id
            ? { ...subscriptionData, id: editingSubscription.id }
            : sub
        );
      } else {
        const newSub: Subscription = {
          ...subscriptionData,
          id: Date.now().toString(),
        };
        updatedSubs = [...subscriptions, newSub];
      }
      setSubscriptions(updatedSubs);
      localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
      calculateAnalytics(updatedSubs);
    }
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {activeSection === 'dashboard' && 'Dashboard'}
              {activeSection === 'subscriptions' && 'Subscriptions'}
              {activeSection === 'analytics' && 'Analytics'}
              {activeSection === 'settings' && 'Settings'}
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and track your subscription services
            </p>
          </div>

          {(activeSection === 'dashboard' || activeSection === 'subscriptions') && (
            <div className="mb-8">
              <SubscriptionTable
                subscriptions={subscriptions}
                onEdit={handleEditSubscription}
                onDelete={handleDeleteSubscription}
                onAdd={handleAddSubscription}
              />
            </div>
          )}

          {(activeSection === 'dashboard' || activeSection === 'analytics') && analytics && (
            <Analytics data={analytics} />
          )}

          {activeSection === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={useApi}
                      onChange={(e) => setUseApi(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                      Use Backend API (requires backend server running)
                    </span>
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
                  <p>Data Storage: {useApi ? 'Remote Database' : 'Local Storage'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SubscriptionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSubscription(null);
        }}
        onSubmit={handleSubmitSubscription}
        subscription={editingSubscription}
      />
    </div>
  );
}

export default App;
