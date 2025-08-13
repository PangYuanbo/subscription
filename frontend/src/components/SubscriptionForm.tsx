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

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subscription: Omit<Subscription, 'id'>) => void;
  subscription?: Subscription | null;
}

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Netflix', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/netflix/netflix-original.svg', category: 'Entertainment' },
  { id: '2', name: 'Spotify', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spotify/spotify-original.svg', category: 'Entertainment' },
  { id: '3', name: 'GitHub', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', category: 'Development' },
  { id: '4', name: 'AWS', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg', category: 'Cloud' },
  { id: '5', name: 'Slack', icon_url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg', category: 'Productivity' },
];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      service: MOCK_SERVICES.find(s => s.id === formData.service_id),
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
              <select
                id="service"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.service_id}
                onChange={(e) =>
                  setFormData({ ...formData, service_id: e.target.value })
                }
                required
              >
                <option value="">Select a service</option>
                {MOCK_SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
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