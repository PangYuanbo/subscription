import React, { useState } from 'react';
import type { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ServiceIcon from '@/components/ServiceIcon';
import TrialStatus from '@/components/TrialStatus';
import { 
  Pencil, 
  Trash2, 
  Search,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Subscription>('service');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
          <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('service')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Service</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('account')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Account</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('payment_date')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Payment Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('monthly_cost')}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>Monthly Cost</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Status</span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedSubscriptions.map((subscription) => (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ServiceIcon 
                      serviceName={subscription.service?.name || 'Unknown'} 
                      size={32}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {subscription.service?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{subscription.account}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {format(new Date(subscription.payment_date), 'MMM dd, yyyy')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">
                    ${subscription.monthly_cost.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrialStatus subscription={subscription} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(subscription)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(subscription.id)}
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