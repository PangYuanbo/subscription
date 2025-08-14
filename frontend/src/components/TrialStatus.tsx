import React from 'react';
import { Subscription } from '@/types';
import { calculateTrialStatus, formatTrialPeriod } from '@/utils/trialUtils';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface TrialStatusProps {
  subscription: Subscription;
  showDetails?: boolean;
}

const TrialStatus: React.FC<TrialStatusProps> = ({ subscription, showDetails = false }) => {
  const trialStatus = calculateTrialStatus(subscription);

  if (!trialStatus) {
    return null;
  }

  const getStatusIcon = () => {
    if (trialStatus.isExpired) return <AlertTriangle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const getStatusStyles = () => {
    const baseStyles = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    switch (trialStatus.statusColor) {
      case 'green':
        return `${baseStyles} bg-green-100 text-green-800`;
      case 'yellow':
        return `${baseStyles} bg-yellow-100 text-yellow-800`;
      case 'red':
        return `${baseStyles} bg-red-100 text-red-800`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-1">
      <div className={getStatusStyles()}>
        {getStatusIcon()}
        <span>{trialStatus.statusText}</span>
      </div>
      
      {showDetails && subscription.trial_start_date && subscription.trial_end_date && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatTrialPeriod(subscription.trial_start_date, subscription.trial_end_date)}</span>
        </div>
      )}
    </div>
  );
};

export default TrialStatus;