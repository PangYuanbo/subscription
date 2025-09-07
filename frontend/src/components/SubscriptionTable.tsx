import React, { useState } from 'react';
import type { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ServiceIcon from '@/components/ServiceIcon';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import { 
  Pencil, 
  Trash2, 
  Search,
  ArrowUpDown,
  Plus,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onNLPAdd?: () => void;
  onRenew: (id: string) => void;
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onAdd,
  onNLPAdd,
  onRenew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Subscription>('service');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [renewingIds, setRenewingIds] = useState<Set<string>>(new Set());

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.account.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'service') {
      aVal = a.service?.name || '';
      bVal = b.service?.name || '';
    }
    
    if (aVal! < bVal!) return sortDirection === 'asc' ? -1 : 1;
    if (aVal! > bVal!) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Subscription) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRenewClick = async (id: string) => {
    // 添加到正在renew的ID集合中
    setRenewingIds(prev => new Set(prev).add(id));
    
    try {
      await onRenew(id);
    } finally {
      // 等待3.5秒让用户看到动画，然后移除
      setTimeout(() => {
        setRenewingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 3500); // 3.5秒后停止旋转
    }
  };

  return (
    <div className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50/30 to-white rounded-xl">
      <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/30 border-b border-slate-200/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100/60 backdrop-blur-sm">
                <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Active Subscriptions</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Manage your {subscriptions.length} active service{subscriptions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {onNLPAdd && (
                <Button onClick={onNLPAdd} className="bg-slate-600/90 hover:bg-slate-700 backdrop-blur-sm border border-slate-200/20 shadow-lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Smart Add
                </Button>
              )}
              <Button onClick={onAdd} className="bg-slate-700/90 hover:bg-slate-800 backdrop-blur-sm border border-slate-200/20 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/60 backdrop-blur-sm border-slate-200/50 focus:border-slate-300 focus:ring-slate-200/50"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white/60 backdrop-blur-sm">
        <table className="w-full">
          <thead className="bg-slate-50/40 backdrop-blur-sm border-b border-slate-200/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('service')}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-800 transition-colors"
                >
                  <span>Service</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('account')}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-800 transition-colors"
                >
                  <span>Account</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('payment_date')}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:text-slate-800 transition-colors"
                >
                  <span>Payment Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cost</span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</span>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/40">
            {sortedSubscriptions.map((subscription, index) => (
              <tr 
                key={subscription.id} 
                className="hover:bg-slate-50/30 transition-all duration-200 backdrop-blur-sm group"
                style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(90deg, rgba(248, 250, 252, 0.3) 0%, rgba(255, 255, 255, 0.4) 100%)' 
                    : 'linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.3) 100%)'
                }}
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="relative">
                      <ServiceIcon 
                        serviceName={subscription.service?.name || 'Unknown'} 
                        size={36}
                        className="mr-4 rounded-lg shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        {subscription.service?.name}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {subscription.service?.category || 'Service'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-slate-700 font-medium">{subscription.account}</div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-slate-700 font-medium">
                    {format(new Date(subscription.payment_date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {format(new Date(subscription.payment_date), 'EEEE')}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-bold text-slate-800 text-base">
                      ${(subscription.cost || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">
                      per {subscription.billing_cycle === 'yearly' ? 'year' : 
                          subscription.billing_cycle === 'weekly' ? 'week' : 'month'}
                      {((subscription.billing_cycle === 'yearly' || subscription.billing_cycle === 'weekly') && subscription.monthly_cost !== undefined) && (
                        <span> • ${subscription.monthly_cost.toFixed(2)}/mo</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <SubscriptionStatus subscription={subscription} />
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRenewClick(subscription.id)}
                      title={subscription.auto_pay ? "Disable auto-renew" : "Enable auto-renew"}
                      disabled={renewingIds.has(subscription.id)}
                      className={`h-8 w-8 rounded-lg border ${
                        subscription.auto_pay 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'border-transparent hover:bg-green-50 hover:border-green-200'
                      }`}
                    >
                      <RefreshCw 
                        className={`h-4 w-4 transition-transform duration-300 ${
                          subscription.auto_pay ? 'text-green-700' : 'text-green-600'
                        } ${
                          renewingIds.has(subscription.id) ? 'animate-spin' : ''
                        }`} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(subscription)}
                      title="Edit subscription"
                      className="h-8 w-8 hover:bg-slate-50 hover:border-slate-200 rounded-lg border border-transparent"
                    >
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(subscription.id)}
                      title="Delete subscription"
                      className="h-8 w-8 hover:bg-red-50 hover:border-red-200 rounded-lg border border-transparent"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionTable;