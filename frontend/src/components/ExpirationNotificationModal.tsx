import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, Calendar, DollarSign } from 'lucide-react';
import { format, differenceInDays, addMonths, addYears, addWeeks } from 'date-fns';
import type { Subscription } from '@/types';
import ServiceIcon from '@/components/ServiceIcon';
import { calculateTrialStatus } from '@/utils/trialUtils';

interface ExpirationNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiringSubscriptions: Subscription[];
  onRenewSubscription: (id: string) => void;
}

const ExpirationNotificationModal: React.FC<ExpirationNotificationModalProps> = ({
  isOpen,
  onClose,
  expiringSubscriptions,
  onRenewSubscription,
}) => {
  const getExpirationInfo = (subscription: Subscription) => {
    // Check if it's a trial
    const trialStatus = calculateTrialStatus(subscription);
    if (trialStatus && !trialStatus.isExpired && subscription.trial_end_date) {
      const daysUntilExpiry = differenceInDays(new Date(subscription.trial_end_date), new Date());
      return {
        type: 'trial' as const,
        daysLeft: Math.max(0, daysUntilExpiry),
        date: subscription.trial_end_date,
        urgencyLevel: daysUntilExpiry <= 1 ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium'
      };
    }
    
    // Regular renewal
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
    
    const daysUntilRenewal = differenceInDays(nextRenewalDate, today);
    return {
      type: 'renewal' as const,
      daysLeft: Math.max(0, daysUntilRenewal),
      date: nextRenewalDate.toISOString(),
      urgencyLevel: daysUntilRenewal <= 1 ? 'critical' : daysUntilRenewal <= 3 ? 'high' : 'medium'
    };
  };

  const getUrgencyStyles = (level: 'critical' | 'high' | 'medium') => {
    switch (level) {
      case 'critical':
        return {
          bgColor: 'bg-red-50/90 border-red-200/50',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-50/90 border-orange-200/50',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-50/90 border-yellow-200/50',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
    }
  };

  const sortedSubscriptions = expiringSubscriptions
    .map(sub => ({ ...sub, expInfo: getExpirationInfo(sub) }))
    .sort((a, b) => a.expInfo.daysLeft - b.expInfo.daysLeft);

  const criticalCount = sortedSubscriptions.filter(s => s.expInfo.urgencyLevel === 'critical').length;
  const highCount = sortedSubscriptions.filter(s => s.expInfo.urgencyLevel === 'high').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 border-b border-slate-200/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 rounded-xl bg-red-100/80"
                      animate={{ 
                        scale: criticalCount > 0 ? [1, 1.05, 1] : 1,
                        rotate: criticalCount > 0 ? [0, -2, 2, 0] : 0 
                      }}
                      transition={{ duration: 2, repeat: criticalCount > 0 ? Infinity : 0 }}
                    >
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Subscription Alerts</h2>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {criticalCount > 0 && (
                          <span className="text-red-600 font-semibold">
                            {criticalCount} critical alert{criticalCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {criticalCount > 0 && highCount > 0 && <span className="mx-1">•</span>}
                        {highCount > 0 && (
                          <span className="text-orange-600 font-semibold">
                            {highCount} high priority
                          </span>
                        )}
                        {criticalCount === 0 && highCount === 0 && (
                          <span>Upcoming renewals and trials</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {sortedSubscriptions.map((subscription) => {
                    const styles = getUrgencyStyles(subscription.expInfo.urgencyLevel);
                    
                    return (
                      <motion.div
                        key={subscription.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`p-4 rounded-xl border ${styles.bgColor} backdrop-blur-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <ServiceIcon
                                serviceName={subscription.service?.name || 'Unknown'}
                                size={40}
                                className="rounded-lg shadow-sm"
                              />
                              {subscription.expInfo.urgencyLevel === 'critical' && (
                                <motion.div 
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${styles.textColor}`}>
                                  {subscription.service?.name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles.badgeColor}`}>
                                  {subscription.expInfo.type === 'trial' ? 'Trial' : 'Subscription'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className={`h-4 w-4 ${styles.iconColor}`} />
                                  <span className={styles.textColor}>
                                    {subscription.expInfo.daysLeft === 0 
                                      ? subscription.expInfo.type === 'trial' ? 'Trial expires today' : 'Renews today'
                                      : subscription.expInfo.daysLeft === 1 
                                      ? subscription.expInfo.type === 'trial' ? 'Trial expires tomorrow' : 'Renews tomorrow'
                                      : `${subscription.expInfo.daysLeft} days left`
                                    }
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Calendar className={`h-4 w-4 ${styles.iconColor}`} />
                                  <span className={styles.textColor}>
                                    {format(new Date(subscription.expInfo.date), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                
                                {subscription.expInfo.type === 'renewal' && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className={`h-4 w-4 ${styles.iconColor}`} />
                                    <span className={styles.textColor}>
                                      ${(subscription.cost || 0).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-slate-500 mt-1">
                                Account: {subscription.account}
                              </div>
                            </div>
                          </div>
                          
                          {subscription.expInfo.type === 'renewal' && (
                            <button
                              onClick={() => onRenewSubscription(subscription.id)}
                              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                            >
                              Renew Now
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50/80 border-t border-slate-200/50 p-4 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  💡 Tip: Set up auto-renewal to avoid service interruptions
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExpirationNotificationModal;