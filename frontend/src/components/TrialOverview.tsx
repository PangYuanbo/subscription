import React from 'react';
import { Subscription } from '@/types';
import { calculateTrialStatus } from '@/utils/trialUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ServiceIcon from '@/components/ServiceIcon';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrialOverviewProps {
  subscriptions: Subscription[];
}

const TrialOverview: React.FC<TrialOverviewProps> = ({ subscriptions }) => {
  const trialSubscriptions = subscriptions.filter(sub => sub.is_trial);
  
  const trialStats = trialSubscriptions.reduce((acc, sub) => {
    const status = calculateTrialStatus(sub);
    if (!status) return acc;
    
    if (status.isExpired) {
      acc.expired++;
    } else if (status.daysRemaining <= 3) {
      acc.expiringSoon++;
    } else {
      acc.active++;
    }
    return acc;
  }, { active: 0, expiringSoon: 0, expired: 0 });

  const expiringSoonSubscriptions = trialSubscriptions
    .map(sub => ({ sub, status: calculateTrialStatus(sub) }))
    .filter(({ status }) => status && !status.isExpired && status.daysRemaining <= 7)
    .sort((a, b) => (a.status?.daysRemaining || 0) - (b.status?.daysRemaining || 0));

  if (trialSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 试用期统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Trials</p>
                <p className="text-2xl font-bold text-green-600">{trialStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{trialStats.expiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{trialStats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 即将到期的试用期列表 */}
      {expiringSoonSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Trials Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringSoonSubscriptions.map(({ sub, status }) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <ServiceIcon serviceName={sub.service?.name || 'Unknown'} size={32} />
                    <div>
                      <p className="font-medium text-gray-900">{sub.service?.name}</p>
                      <p className="text-sm text-gray-600">{sub.account}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-yellow-800">
                      {status?.statusText}
                    </p>
                    <p className="text-xs text-gray-600">
                      ${sub.monthly_cost.toFixed(2)}/month
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrialOverview;