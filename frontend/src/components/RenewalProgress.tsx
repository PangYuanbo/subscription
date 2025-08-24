import React, { useEffect, useState } from 'react';
import { differenceInDays, addMonths, addYears, addWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import type { Subscription } from '@/types';

interface RenewalProgressProps {
  subscription: Subscription;
}

const RenewalProgress: React.FC<RenewalProgressProps> = ({ subscription }) => {
  const [progress, setProgress] = useState(0);
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(0);
  // @ts-ignore: totalDays used in setTotalDays call
  const [totalDays, setTotalDays] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
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
      setTotalDays(totalDuration); // Keep for potential future use
      
      setTimeout(() => {
        setIsAnimating(true);
        setProgress(progressPercentage);
      }, 100);
    };

    calculateProgress();
  }, [subscription]);

  const getProgressColor = () => {
    if (daysUntilRenewal <= 3) return '#ef4444';
    if (daysUntilRenewal <= 7) return '#f97316';
    if (daysUntilRenewal <= 14) return '#eab308';
    return '#22c55e';
  };

  const getBackgroundColor = () => {
    if (daysUntilRenewal <= 3) return 'bg-red-100';
    if (daysUntilRenewal <= 7) return 'bg-orange-100';
    if (daysUntilRenewal <= 14) return 'bg-yellow-100';
    return 'bg-gray-200';
  };

  const getPulseAnimation = () => {
    if (daysUntilRenewal <= 3) {
      return {
        scale: [1, 1.05, 1],
        transition: { duration: 1, repeat: Infinity }
      };
    }
    return {};
  };

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-1">
        <motion.span 
          className="text-xs font-medium text-gray-700"
          animate={daysUntilRenewal <= 3 ? { color: ['#374151', '#ef4444', '#374151'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {daysUntilRenewal} days left
        </motion.span>
        <span className="text-xs text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      <motion.div 
        className={`w-full ${getBackgroundColor()} rounded-full h-2.5 overflow-hidden relative`}
        animate={getPulseAnimation()}
      >
        <motion.div
          className="h-2.5 rounded-full relative overflow-hidden"
          style={{ backgroundColor: getProgressColor() }}
          initial={{ width: 0 }}
          animate={isAnimating ? { width: `${progress}%` } : { width: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: '50%' }}
          />
        </motion.div>
        {daysUntilRenewal <= 7 && (
          <motion.div
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          </motion.div>
        )}
      </motion.div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {subscription.billing_cycle === 'yearly' ? 'Annual' : 
           subscription.billing_cycle === 'weekly' ? 'Weekly' : 'Monthly'} renewal
        </span>
        {daysUntilRenewal <= 7 && (
          <motion.span 
            className="text-xs font-semibold text-red-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Due Soon!
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default RenewalProgress;