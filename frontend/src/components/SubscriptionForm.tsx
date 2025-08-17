import React, { useState, useEffect } from 'react';
import type { Subscription, BillingCycle } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ServiceAutocomplete from '@/components/ServiceAutocomplete';
import { PREDEFINED_SERVICES } from '@/data/services';
import { getCommonTrialDurations, calculateTrialEndDate } from '@/utils/trialUtils';
import type { ServiceData } from '@/data/services';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subscription: Omit<Subscription, 'id'>) => void;
  subscription?: Subscription | null;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subscription,
}) => {
  const [formData, setFormData] = useState({
    service_id: '',
    account: '',
    payment_date: '',
    cost: 0,
    billing_cycle: 'monthly' as BillingCycle,
    is_trial: false,
    trial_start_date: '',
    trial_duration_days: 30,
  });
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [customServiceName, setCustomServiceName] = useState('');

  useEffect(() => {
    if (subscription) {
      setFormData({
        service_id: subscription.service_id,
        account: subscription.account,
        payment_date: subscription.payment_date,
        cost: subscription.cost,
        billing_cycle: subscription.billing_cycle,
        is_trial: subscription.is_trial || false,
        trial_start_date: subscription.trial_start_date || '',
        trial_duration_days: subscription.trial_duration_days || 30,
      });
      
      // 设置选中的服务
      if (subscription.service_id === 'custom') {
        setSelectedService(null);
        setCustomServiceName(subscription.service?.name || '');
      } else {
        const predefinedService = PREDEFINED_SERVICES.find(s => s.id === subscription.service_id);
        setSelectedService(predefinedService || null);
        setCustomServiceName('');
      }
    } else {
      setFormData({
        service_id: '',
        account: '',
        payment_date: new Date().toISOString().split('T')[0],
        cost: 0,
        billing_cycle: 'monthly' as BillingCycle,
        is_trial: false,
        trial_start_date: new Date().toISOString().split('T')[0],
        trial_duration_days: 30,
      });
      setSelectedService(null);
      setCustomServiceName('');
    }
  }, [subscription]);

  const handleServiceSelect = (service: ServiceData | null, customName?: string) => {
    if (service) {
      // 选择了预定义服务
      setSelectedService(service);
      setFormData({ ...formData, service_id: service.id });
      setCustomServiceName('');
    } else if (customName) {
      // 输入了自定义服务名称
      setSelectedService(null);
      setFormData({ ...formData, service_id: 'custom' });
      setCustomServiceName(customName);
    } else {
      // 清空选择
      setSelectedService(null);
      setFormData({ ...formData, service_id: '' });
      setCustomServiceName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证服务选择
    if (!formData.service_id) {
      alert('请选择或输入服务商名称');
      return;
    }

    if (formData.service_id === 'custom' && !customServiceName.trim()) {
      alert('请输入自定义服务商名称');
      return;
    }
    
    let service;
    if (formData.service_id === 'custom') {
      service = {
        id: 'custom',
        name: customServiceName.trim(),
        category: 'Other',
      };
    } else {
      service = selectedService || PREDEFINED_SERVICES.find(s => s.id === formData.service_id);
    }
    
    // 计算月费用
    const monthly_cost = formData.billing_cycle === 'yearly' 
      ? formData.cost / 12 
      : formData.cost;

    let submissionData: any = {
      ...formData,
      service,
      monthly_cost,
    };

    // 如果是试用期，计算结束日期
    if (formData.is_trial && formData.trial_start_date) {
      submissionData.trial_end_date = calculateTrialEndDate(
        formData.trial_start_date, 
        formData.trial_duration_days
      );
    }
    
    onSubmit(submissionData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? 'Edit Subscription' : 'Add New Subscription'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your subscription service.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">
                Service
              </Label>
              <div className="col-span-3">
                <ServiceAutocomplete
                  value={formData.service_id}
                  onServiceSelect={handleServiceSelect}
                  placeholder="输入服务商名称，支持自动提示..."
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                Account
              </Label>
              <Input
                id="account"
                className="col-span-3"
                value={formData.account}
                onChange={(e) =>
                  setFormData({ ...formData, account: e.target.value })
                }
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_date" className="text-right">
                Payment Date
              </Label>
              <Input
                id="payment_date"
                type="date"
                className="col-span-3"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, payment_date: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billing_cycle" className="text-right">
                Billing Cycle
              </Label>
              <select
                id="billing_cycle"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.billing_cycle}
                onChange={(e) =>
                  setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })
                }
              >
                <option value="monthly">Monthly (月费)</option>
                <option value="yearly">Yearly (年费)</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                {formData.billing_cycle === 'yearly' ? 'Annual Cost' : 'Monthly Cost'}
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={formData.billing_cycle === 'yearly' ? '99.99' : '9.99'}
                  required
                />
                {formData.billing_cycle === 'yearly' && formData.cost > 0 && (
                  <div className="text-xs text-gray-600">
                    Monthly equivalent: ${(formData.cost / 12).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* 试用期设置 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Trial Period
              </Label>
              <div className="col-span-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_trial}
                    onChange={(e) =>
                      setFormData({ ...formData, is_trial: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    This subscription has a free trial
                  </span>
                </label>
              </div>
            </div>

            {/* 试用期详细设置 */}
            {formData.is_trial && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="trial_start_date" className="text-right">
                    Trial Start
                  </Label>
                  <Input
                    id="trial_start_date"
                    type="date"
                    className="col-span-3"
                    value={formData.trial_start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, trial_start_date: e.target.value })
                    }
                    required={formData.is_trial}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="trial_duration" className="text-right">
                    Trial Duration
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <select
                      id="trial_duration"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.trial_duration_days}
                      onChange={(e) =>
                        setFormData({ ...formData, trial_duration_days: parseInt(e.target.value) })
                      }
                    >
                      {getCommonTrialDurations().map((duration) => (
                        <option key={duration.days} value={duration.days}>
                          {duration.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* 显示计算出的结束日期 */}
                    {formData.trial_start_date && (
                      <div className="text-xs text-gray-600">
                        Trial ends: {calculateTrialEndDate(formData.trial_start_date, formData.trial_duration_days)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {subscription ? 'Update' : 'Add'} Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionForm;