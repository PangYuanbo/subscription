import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionForm from '@/components/SubscriptionForm';
import NLPSubscriptionForm from '@/components/NLPSubscriptionForm';
import Analytics from '@/components/Analytics';
import TrialOverview from '@/components/TrialOverview';
import type { Subscription, Analytics as AnalyticsData, MonthlySpending } from '@/types';
// import { subscriptionApi } from '@/api/client';
import { useAuthenticatedApi } from '@/api/auth-client';
import { useUserData } from '@/hooks/useUserData';
import { useAuth0 } from '@auth0/auth0-react';

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    service_id: 'netflix',
    service: { id: 'netflix', name: 'Netflix', category: 'Entertainment' },
    account: 'family@example.com',
    payment_date: '2024-01-15',
    cost: 19.99,
    billing_cycle: 'monthly',
    monthly_cost: 19.99,
  },
  {
    id: '2',
    service_id: 'spotify',
    service: { id: 'spotify', name: 'Spotify', category: 'Entertainment' },
    account: 'user@example.com',
    payment_date: '2024-01-10',
    cost: 99.99,
    billing_cycle: 'yearly',
    monthly_cost: 8.33,
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
    cost: 7.00,
    billing_cycle: 'monthly',
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
    cost: 1800.00,
    billing_cycle: 'yearly',
    monthly_cost: 150.00,
  },
  {
    id: '5',
    service_id: 'custom',
    service: { id: 'custom', name: 'Custom Service', category: 'Other' },
    account: 'test@example.com',
    payment_date: '2024-01-05',
    cost: 25.00,
    billing_cycle: 'monthly',
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
  const [isNLPFormOpen, setIsNLPFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [useApi, setUseApi] = useState(true);
  const { getUserData, setUserData } = useUserData();
  const { isAuthenticated, isLoading } = useAuth0();
  const authenticatedApi = useAuthenticatedApi();

  useEffect(() => {
    // Don't load data if Auth0 is still loading or token is not ready
    if (!isLoading && authenticatedApi.isTokenReady) {
      loadData();
    }
  }, [useApi, isAuthenticated, isLoading, authenticatedApi.isTokenReady]);

  const loadData = async () => {
    // Check if Auth0 is configured
    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const shouldUseApi = useApi && (isAuthenticated || !auth0Domain);
    
    console.log('Loading data:', { 
      useApi, 
      isAuthenticated, 
      auth0Domain: !!auth0Domain, 
      shouldUseApi 
    });
    
    if (shouldUseApi) {
      try {
        const [subs, analyticsData] = await Promise.all([
          authenticatedApi.subscriptions.getAll(),
          authenticatedApi.analytics.get(),
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
    const storedSubs = getUserData('subscriptions');
    if (storedSubs) {
      setSubscriptions(JSON.parse(storedSubs));
    } else {
      setSubscriptions(MOCK_SUBSCRIPTIONS);
      setUserData('subscriptions', MOCK_SUBSCRIPTIONS);
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

    const storedMonthlyTrend = getUserData('monthlySpendingTrend');
    let monthlyTrend: MonthlySpending[];
    
    if (storedMonthlyTrend) {
      monthlyTrend = JSON.parse(storedMonthlyTrend);
    } else {
      monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(2024, i);
        const month = date.toLocaleString('default', { month: 'short' });
        return { 
          month, 
          year: 2024, 
          projected: totalMonthly,
          actual: undefined
        };
      });
      setUserData('monthlySpendingTrend', monthlyTrend);
    }

    monthlyTrend = monthlyTrend.map(item => ({
      ...item,
      projected: totalMonthly
    }));

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

  const handleNLPAddSubscription = () => {
    setIsNLPFormOpen(true);
  };

  const handleNLPSuccess = () => {
    loadData();
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsFormOpen(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
      const shouldUseApi = useApi && (isAuthenticated || !auth0Domain);
      
      if (shouldUseApi) {
        try {
          await authenticatedApi.subscriptions.delete(id);
          await loadData();
        } catch (error) {
          console.error('Failed to delete subscription', error);
        }
      } else {
        const updatedSubs = subscriptions.filter(sub => sub.id !== id);
        setSubscriptions(updatedSubs);
        setUserData('subscriptions', updatedSubs);
        calculateAnalytics(updatedSubs);
      }
    }
  };

  const handleSubmitSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const shouldUseApi = useApi && (isAuthenticated || !auth0Domain);
    
    if (shouldUseApi) {
      try {
        if (editingSubscription) {
          await authenticatedApi.subscriptions.update(editingSubscription.id, subscriptionData);
        } else {
          await authenticatedApi.subscriptions.create(subscriptionData);
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
      setUserData('subscriptions', updatedSubs);
      calculateAnalytics(updatedSubs);
    }
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  const handleMonthlySpendingUpdate = (updatedData: MonthlySpending[]) => {
    setUserData('monthlySpendingTrend', updatedData);
    if (analytics) {
      setAnalytics({
        ...analytics,
        monthly_trend: updatedData,
      });
    }
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
                onNLPAdd={(useApi && (isAuthenticated || !import.meta.env.VITE_AUTH0_DOMAIN)) ? handleNLPAddSubscription : undefined}
              />
              {analytics && <Analytics data={analytics} onMonthlySpendingUpdate={handleMonthlySpendingUpdate} />}
            </div>
          )}

          {activeSection === 'subscriptions' && (
            <SubscriptionTable
              subscriptions={subscriptions}
              onEdit={handleEditSubscription}
              onDelete={handleDeleteSubscription}
              onAdd={handleAddSubscription}
              onNLPAdd={useApi ? handleNLPAddSubscription : undefined}
            />
          )}

          {activeSection === 'analytics' && analytics && (
            <Analytics data={analytics} onMonthlySpendingUpdate={handleMonthlySpendingUpdate} />
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h2>
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
                    <p>API Address: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</p>
                    <p>Data Storage: {useApi ? 'Remote Database' : 'Local Storage'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Icon System</h2>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Application includes 50+ predefined popular service icons</p>
                  <p>• Custom services automatically generate initial icons</p>
                  <p>• Supports Chinese and English service names</p>
                  <p>• Colors determined by service name, ensuring consistency</p>
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

      <NLPSubscriptionForm
        isOpen={isNLPFormOpen}
        onClose={() => setIsNLPFormOpen(false)}
        onSuccess={handleNLPSuccess}
      />
    </div>
  );
}

export default App;
