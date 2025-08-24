import React, { useEffect, useState } from 'react';
import { differenceInDays, addMonths, addYears, addWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import type { Subscription } from '@/types';
import { calculateTrialStatus } from '@/utils/trialUtils';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription: Subscription;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ subscription }) => {
  const [renewalProgress, setRenewalProgress] = useState(0);
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if subscription is in trial
  const trialStatus = calculateTrialStatus(subscription);
  const isInTrial = trialStatus && !trialStatus.isExpired;

  useEffect(() => {
    // Only calculate renewal progress if not in trial
    if (!isInTrial) {
      const calculateProgress = () => {
        const today = new Date();
        const paymentDate = new Date(subscription.payment_date);
        
        let nextRenewalDate: Date;
        if (subscription.billing_cycle === 'yearly') {
          nextRenewalDate = addYears(paymentDate, 1);
        } else if (subscription.billing_cycle === 'weekly') {
          nextRenewalDate = addWeeks(paymentDate, 1);
        } else {
          nextRenewalDate = addMonths(paymentDate, 1);
        }
        
        const totalDuration = differenceInDays(nextRenewalDate, paymentDate);
        const elapsed = differenceInDays(today, paymentDate);
        const remaining = differenceInDays(nextRenewalDate, today);
        
        const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        
        setDaysUntilRenewal(Math.max(0, remaining));
        
        setTimeout(() => {
          setIsAnimating(true);
          setRenewalProgress(progressPercentage);
        }, 100);
      };

      calculateProgress();
    }
  }, [subscription, isInTrial]);

  // Trial Status Component
  if (isInTrial) {
    const getTrialIcon = () => {
      if (trialStatus.isExpired) return <AlertTriangle className="h-3 w-3" />;
      return <Clock className="h-3 w-3" />;
    };

    const getTrialStyles = () => {
      const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border";
      switch (trialStatus.statusColor) {
        case 'green':
          return `${baseStyles} bg-green-50/80 text-green-800 border-green-200/50`;
        case 'yellow':
          return `${baseStyles} bg-yellow-50/80 text-yellow-800 border-yellow-200/50`;
        case 'red':
          return `${baseStyles} bg-red-50/80 text-red-800 border-red-200/50`;
        default:
          return `${baseStyles} bg-gray-50/80 text-gray-800 border-gray-200/50`;
      }
    };

    return (
      <div className="w-full max-w-xs">
        <div className={getTrialStyles()}>
          {getTrialIcon()}
          <span>{trialStatus.statusText}</span>
        </div>
        {subscription.trial_end_date && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <Calendar className="h-3 w-3" />
            <span>Until {new Date(subscription.trial_end_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    );
  }

  // Renewal Progress Component
  const getProgressColor = () => {
    if (daysUntilRenewal <= 3) return '#ef4444';
    if (daysUntilRenewal <= 7) return '#f97316';
    if (daysUntilRenewal <= 14) return '#eab308';
    return '#10b981';
  };

  const getBackgroundColor = () => {
    if (daysUntilRenewal <= 3) return 'bg-red-50/80';
    if (daysUntilRenewal <= 7) return 'bg-orange-50/80';
    if (daysUntilRenewal <= 14) return 'bg-yellow-50/80';
    return 'bg-slate-100/60';
  };

  const getPulseAnimation = () => {
    if (daysUntilRenewal <= 3) {
      return {
        scale: [1, 1.02, 1],
        transition: { duration: 1.5, repeat: Infinity }
      };
    }
    return {};
  };

  const getStatusText = () => {
    if (daysUntilRenewal === 0) return 'Due Today';
    if (daysUntilRenewal === 1) return '1 day left';
    return `${daysUntilRenewal} days left`;
  };

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-1.5">
        <motion.span 
          className="text-xs font-semibold text-slate-700"
          animate={daysUntilRenewal <= 3 ? { color: ['#374151', '#ef4444', '#374151'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getStatusText()}
        </motion.span>
        <span className="text-xs text-slate-500 font-medium">
          {Math.round(renewalProgress)}%
        </span>
      </div>
      
      <motion.div 
        className={`w-full ${getBackgroundColor()} rounded-lg h-2 overflow-hidden relative backdrop-blur-sm border border-slate-200/30`}
        animate={getPulseAnimation()}
      >
        <motion.div
          className="h-2 rounded-lg relative overflow-hidden"
          style={{ backgroundColor: getProgressColor() }}
          initial={{ width: 0 }}
          animate={isAnimating ? { width: `${renewalProgress}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ width: '40%' }}
          />
        </motion.div>
        
        {daysUntilRenewal <= 7 && (
          <motion.div
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
          </motion.div>
        )}
      </motion.div>
      
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {subscription.billing_cycle === 'yearly' ? 'Annual' : 
           subscription.billing_cycle === 'weekly' ? 'Weekly' : 'Monthly'} billing
        </span>
        {daysUntilRenewal <= 7 && (
          <motion.span 
            className="text-xs font-semibold text-red-600"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Due Soon
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;