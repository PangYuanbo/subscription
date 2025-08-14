import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionForm from '@/components/SubscriptionForm';
import Analytics from '@/components/Analytics';
import TrialOverview from '@/components/TrialOverview';
import type { Subscription, Analytics as AnalyticsData } from '@/types';
import { subscriptionApi } from '@/api/client';

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    service_id: 'netflix',
    service: { id: 'netflix', name: 'Netflix', category: 'Entertainment' },
    account: 'family@example.com',
    payment_date: '2024-01-15',
    monthly_cost: 19.99,
  },
  {
    id: '2',
    service_id: 'spotify',
    service: { id: 'spotify', name: 'Spotify', category: 'Entertainment' },
    account: 'user@example.com',
    payment_date: '2024-01-10',
    monthly_cost: 9.99,
    is_trial: true,
    trial_start_date: '2024-12-01',
    trial_end_date: '2024-12-31',
    trial_duration_days: 30,
  },
  {
    id: '3',
    service_id: 'github',
    service: { id: 'github', name: 'GitHub', category: 'Development' },
    account: 'dev@example.com',
    payment_date: '2024-01-01',
    monthly_cost: 7.00,
    is_trial: true,
    trial_start_date: '2024-12-10',
    trial_end_date: '2024-12-17',
    trial_duration_days: 7,
  },
  {
    id: '4',
    service_id: 'aws',
    service: { id: 'aws', name: 'Amazon Web Services', category: 'Cloud' },
    account: 'admin@company.com',
    payment_date: '2024-01-01',
    monthly_cost: 150.00,
  },
  {
    id: '5',
    service_id: 'custom',
    service: { id: 'custom', name: '自定义服务', category: 'Other' },
    account: 'test@example.com',
    payment_date: '2024-01-05',
    monthly_cost: 25.00,
    is_trial: true,
    trial_start_date: '2024-12-05',
    trial_end_date: '2024-12-19',
    trial_duration_days: 14,
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

          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <TrialOverview subscriptions={subscriptions} />
              <SubscriptionTable
                subscriptions={subscriptions}
                onEdit={handleEditSubscription}
                onDelete={handleDeleteSubscription}
                onAdd={handleAddSubscription}
              />
              {analytics && <Analytics data={analytics} />}
            </div>
          )}

          {activeSection === 'subscriptions' && (
            <SubscriptionTable
              subscriptions={subscriptions}
              onEdit={handleEditSubscription}
              onDelete={handleDeleteSubscription}
              onAdd={handleAddSubscription}
            />
          )}

          {activeSection === 'analytics' && analytics && (
            <Analytics data={analytics} />
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">应用设置</h2>
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
                        使用后端API (需要后端服务器运行)
                      </span>
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>API地址: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
                    <p>数据存储: {useApi ? '远程数据库' : '本地存储'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">图标系统</h2>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• 应用包含50+预定义热门服务商图标</p>
                  <p>• 自定义服务自动生成首字母图标</p>
                  <p>• 支持中英文服务名称</p>
                  <p>• 颜色根据服务名称确定，保证一致性</p>
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
