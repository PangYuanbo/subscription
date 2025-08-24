import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SubscriptionTable from '@/components/SubscriptionTable';
import SubscriptionForm from '@/components/SubscriptionForm';
import NLPSubscriptionForm from '@/components/NLPSubscriptionForm';
import Analytics from '@/components/Analytics';
import TrialOverview from '@/components/TrialOverview';
import ExpirationNotificationModal from '@/components/ExpirationNotificationModal';
import { LoadingOverlay, LoadingSteps } from '@/components/ui/loading';
import type { Subscription, Analytics as AnalyticsData, MonthlySpending } from '@/types';
// import { subscriptionApi } from '@/api/client';
import { useAuthenticatedApi } from '@/api/auth-client';
import { useUserData } from '@/hooks/useUserData';
import { useAuth0 } from '@auth0/auth0-react';
import { findExpiringSubscriptions, shouldShowExpirationNotifications } from '@/utils/expirationUtils';

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
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [hasShownExpirationToday, setHasShownExpirationToday] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<Array<{
    title: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    description?: string;
  }>>([]);
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
      // Show loading animation for API calls
      setIsLoadingData(true);
      setLoadingSteps([
        { title: "Connecting to database", status: 'loading', description: "Establishing secure connection" },
        { title: "Loading subscriptions", status: 'pending', description: "Fetching your subscription data" },
        { title: "Calculating analytics", status: 'pending', description: "Processing financial insights" },
        { title: "Checking notifications", status: 'pending', description: "Scanning for important alerts" }
      ]);

      try {
        // Step 1: Connection established
        setTimeout(() => {
          setLoadingSteps(prev => prev.map((step, i) => 
            i === 0 ? { ...step, status: 'completed' } :
            i === 1 ? { ...step, status: 'loading' } : step
          ));
        }, 500);

        const [subs, analyticsData] = await Promise.all([
          authenticatedApi.subscriptions.getAll(),
          authenticatedApi.analytics.get(),
        ]);

        // Step 2: Subscriptions loaded
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 1 ? { ...step, status: 'completed' } :
          i === 2 ? { ...step, status: 'loading' } : step
        ));
        
        setSubscriptions(subs);
        setAnalytics(analyticsData);
        
        // Step 3: Analytics calculated
        setTimeout(() => {
          setLoadingSteps(prev => prev.map((step, i) => 
            i === 2 ? { ...step, status: 'completed' } :
            i === 3 ? { ...step, status: 'loading' } : step
          ));
        }, 200);
        
        // Step 4: Check notifications
        checkExpiringSubscriptions(subs);
        
        setTimeout(() => {
          setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
          setTimeout(() => setIsLoadingData(false), 500);
        }, 400);

      } catch (error) {
        console.error('Failed to load data from API, using mock data', error);
        setLoadingSteps(prev => prev.map(step => 
          step.status === 'loading' ? { ...step, status: 'error' } : step
        ));
        setTimeout(() => {
          setIsLoadingData(false);
          loadMockData();
        }, 1000);
      }
    } else {
      loadMockData();
    }
  };

  const loadMockData = () => {
    const storedSubs = getUserData('subscriptions');
    const subsToUse = storedSubs ? JSON.parse(storedSubs) : MOCK_SUBSCRIPTIONS;
    if (storedSubs) {
      setSubscriptions(subsToUse);
    } else {
      setSubscriptions(MOCK_SUBSCRIPTIONS);
      setUserData('subscriptions', MOCK_SUBSCRIPTIONS);
    }
    calculateAnalytics(subsToUse);
    
    // Check for expiring subscriptions after loading mock data
    checkExpiringSubscriptions(subsToUse);
  };

  // Check for expiring subscriptions and show modal if needed
  const checkExpiringSubscriptions = (subs: Subscription[]) => {
    const expiringSubscriptions = findExpiringSubscriptions(subs, 7); // Check 7 days ahead
    
    // Get last shown timestamp from localStorage
    const lastShownKey = 'expiration-modal-last-shown';
    const lastShownTime = localStorage.getItem(lastShownKey);
    const lastShownTimestamp = lastShownTime ? parseInt(lastShownTime) : undefined;
    
    if (shouldShowExpirationNotifications(expiringSubscriptions, lastShownTimestamp) && !hasShownExpirationToday) {
      // Small delay to ensure UI has rendered
      setTimeout(() => {
        setShowExpirationModal(true);
        setHasShownExpirationToday(true);
        localStorage.setItem(lastShownKey, Date.now().toString());
      }, 1500);
    }
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
        // 乐观删除：先从UI中移除
        const deletedSubscription = subscriptions.find(sub => sub.id === id);
        const optimisticSubs = subscriptions.filter(sub => sub.id !== id);
        
        // 立即更新UI
        setSubscriptions(optimisticSubs);
        calculateAnalytics(optimisticSubs);
        
        // 后台API调用
        try {
          await authenticatedApi.subscriptions.delete(id);
          // API成功后重新加载数据确保同步
          setTimeout(() => loadData(), 100);
        } catch (error) {
          console.error('Failed to delete subscription', error);
          // 出错时恢复删除的项目
          if (deletedSubscription) {
            const restoredSubs = [...subscriptions, deletedSubscription];
            setSubscriptions(restoredSubs);
            calculateAnalytics(restoredSubs);
          }
          alert('Failed to delete subscription. Please try again.');
        }
      } else {
        // 本地存储模式保持原有逻辑
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
    
    // 关闭表单和重置编辑状态
    setIsFormOpen(false);
    setEditingSubscription(null);
    
    if (shouldUseApi) {
      if (editingSubscription) {
        // 编辑现有订阅 - 乐观更新
        const optimisticSub: Subscription = {
          ...subscriptionData,
          id: editingSubscription.id
        };
        
        const optimisticSubs = subscriptions.map(sub =>
          sub.id === editingSubscription.id ? optimisticSub : sub
        );
        
        // 立即更新UI
        setSubscriptions(optimisticSubs);
        calculateAnalytics(optimisticSubs);
        
        // 后台API调用
        try {
          await authenticatedApi.subscriptions.update(editingSubscription.id, subscriptionData);
          // API成功后重新加载最新数据
          await loadData();
        } catch (error) {
          console.error('Failed to update subscription', error);
          // 出错时回滚到原始数据
          await loadData();
          alert('Failed to update subscription. Please try again.');
        }
      } else {
        // 添加新订阅 - 乐观更新
        const tempId = `temp_${Date.now()}`;
        const optimisticSub: Subscription = {
          ...subscriptionData,
          id: tempId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const optimisticSubs = [...subscriptions, optimisticSub];
        
        // 立即更新UI
        setSubscriptions(optimisticSubs);
        calculateAnalytics(optimisticSubs);
        
        // 后台API调用
        try {
          const newSubscription = await authenticatedApi.subscriptions.create(subscriptionData);
          // API成功后用真实数据替换临时数据
          const finalSubs = optimisticSubs.map(sub => 
            sub.id === tempId ? newSubscription : sub
          );
          setSubscriptions(finalSubs);
          calculateAnalytics(finalSubs);
          
          // 然后重新加载所有数据确保同步
          setTimeout(() => loadData(), 100);
        } catch (error) {
          console.error('Failed to create subscription', error);
          // 出错时移除乐观添加的项目
          setSubscriptions(subscriptions);
          calculateAnalytics(subscriptions);
          alert('Failed to create subscription. Please try again.');
        }
      }
    } else {
      // 本地存储模式保持原有逻辑
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
  };

  const handleRenewSubscription = async (id: string) => {
    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const shouldUseApi = useApi && (isAuthenticated || !auth0Domain);
    
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription) return;
    
    const newPaymentDate = new Date(subscription.payment_date);
    if (subscription.billing_cycle === 'yearly') {
      newPaymentDate.setFullYear(newPaymentDate.getFullYear() + 1);
    } else {
      newPaymentDate.setMonth(newPaymentDate.getMonth() + 1);
    }
    
    const updatedPaymentDate = newPaymentDate.toISOString().split('T')[0];
    
    // 乐观更新：立即更新UI
    const optimisticSubs = subscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          payment_date: updatedPaymentDate
        };
      }
      return sub;
    });
    
    setSubscriptions(optimisticSubs);
    calculateAnalytics(optimisticSubs);
    console.log('Subscription renewed successfully');
    
    if (shouldUseApi) {
      // 后台API调用
      try {
        await authenticatedApi.subscriptions.update(id, {
          payment_date: updatedPaymentDate
        });
        // API成功后重新加载数据确保同步
        setTimeout(() => loadData(), 100);
      } catch (error) {
        console.error('Failed to renew subscription', error);
        // 出错时回滚到原始数据
        await loadData();
        alert('Failed to renew subscription. Please try again.');
      }
    } else {
      // 本地存储模式
      setUserData('subscriptions', optimisticSubs);
    }
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
                onRenew={handleRenewSubscription}
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
              onRenew={handleRenewSubscription}
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
        existingSubscriptions={subscriptions}
      />

      <NLPSubscriptionForm
        isOpen={isNLPFormOpen}
        onClose={() => setIsNLPFormOpen(false)}
        onSuccess={handleNLPSuccess}
      />

      <ExpirationNotificationModal
        isOpen={showExpirationModal}
        onClose={() => setShowExpirationModal(false)}
        expiringSubscriptions={findExpiringSubscriptions(subscriptions, 7)}
        onRenewSubscription={handleRenewSubscription}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoadingData}>
        <LoadingSteps steps={loadingSteps} className="max-w-md" />
      </LoadingOverlay>
    </div>
  );
}

export default App;
