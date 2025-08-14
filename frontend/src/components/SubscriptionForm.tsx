import React, { useState, useEffect } from 'react';
import type { Subscription, Service } from '@/types';
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
import ServiceIcon from '@/components/ServiceIcon';
import { PREDEFINED_SERVICES } from '@/data/services';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subscription: Omit<Subscription, 'id'>) => void;
  subscription?: Subscription | null;
}

// 添加一个选项来允许用户输入自定义服务
const CUSTOM_SERVICE_OPTION = { id: 'custom', name: '自定义服务...', category: 'Other' };

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
    monthly_cost: 0,
  });
  const [customServiceName, setCustomServiceName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (subscription) {
      setFormData({
        service_id: subscription.service_id,
        account: subscription.account,
        payment_date: subscription.payment_date,
        monthly_cost: subscription.monthly_cost,
      });
    } else {
      setFormData({
        service_id: '',
        account: '',
        payment_date: new Date().toISOString().split('T')[0],
        monthly_cost: 0,
      });
    }
  }, [subscription]);

  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, service_id: serviceId });
    setShowCustomInput(serviceId === 'custom');
    if (serviceId !== 'custom') {
      setCustomServiceName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let service;
    if (formData.service_id === 'custom') {
      service = {
        id: 'custom',
        name: customServiceName,
        category: 'Other',
      };
    } else {
      service = PREDEFINED_SERVICES.find(s => s.id === formData.service_id);
    }
    
    onSubmit({
      ...formData,
      service,
    });
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
              <div className="col-span-3 space-y-2">
                <select
                  id="service"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.service_id}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  required
                >
                  <option value="">选择服务商</option>
                  {PREDEFINED_SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.category})
                    </option>
                  ))}
                  <option value="custom">{CUSTOM_SERVICE_OPTION.name}</option>
                </select>
                
                {/* 显示选中服务的图标预览 */}
                {formData.service_id && formData.service_id !== 'custom' && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <ServiceIcon 
                      serviceName={PREDEFINED_SERVICES.find(s => s.id === formData.service_id)?.name || ''}
                      size={24}
                    />
                    <span className="text-sm text-gray-600">图标预览</span>
                  </div>
                )}
                
                {/* 自定义服务名称输入 */}
                {showCustomInput && (
                  <Input
                    placeholder="输入自定义服务名称"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    required={formData.service_id === 'custom'}
                  />
                )}
                
                {/* 自定义服务图标预览 */}
                {showCustomInput && customServiceName && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <ServiceIcon 
                      serviceName={customServiceName}
                      size={24}
                    />
                    <span className="text-sm text-gray-600">将生成首字母图标</span>
                  </div>
                )}
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
              <Label htmlFor="monthly_cost" className="text-right">
                Monthly Cost
              </Label>
              <Input
                id="monthly_cost"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.monthly_cost}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_cost: parseFloat(e.target.value) })
                }
                placeholder="9.99"
                required
              />
            </div>
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