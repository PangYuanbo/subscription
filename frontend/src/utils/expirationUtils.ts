import { differenceInDays, addMonths, addYears, addWeeks } from 'date-fns';
import type { Subscription } from '@/types';
import { calculateTrialStatus } from './trialUtils';

export interface ExpiringSubscription extends Subscription {
  daysUntilExpiration: number;
  expirationType: 'trial' | 'renewal';
  urgencyLevel: 'critical' | 'high' | 'medium';
}

/**
 * Find subscriptions that are expiring soon
 * @param subscriptions - Array of subscriptions
 * @param daysThreshold - Maximum days to consider as "expiring soon" (default: 7)
 * @returns Array of expiring subscriptions with additional metadata
 */
export const findExpiringSubscriptions = (
  subscriptions: Subscription[],
  daysThreshold: number = 7
): ExpiringSubscription[] => {
  const today = new Date();
  const expiringSubscriptions: ExpiringSubscription[] = [];

  for (const subscription of subscriptions) {
    // Skip subscriptions with auto-pay enabled (auto-renewal)
    if (subscription.auto_pay) {
      continue;
    }

    let daysUntilExpiration: number;
    let expirationType: 'trial' | 'renewal';

    // Check if subscription is in trial period
    const trialStatus = calculateTrialStatus(subscription);
    if (trialStatus && !trialStatus.isExpired && subscription.trial_end_date) {
      daysUntilExpiration = differenceInDays(new Date(subscription.trial_end_date), today);
      expirationType = 'trial';
    } else {
      // Calculate next renewal date
      const paymentDate = new Date(subscription.payment_date);
      let nextRenewalDate: Date;

      if (subscription.billing_cycle === 'yearly') {
        nextRenewalDate = addYears(paymentDate, 1);
      } else if (subscription.billing_cycle === 'weekly') {
        nextRenewalDate = addWeeks(paymentDate, 1);
      } else {
        nextRenewalDate = addMonths(paymentDate, 1);
      }

      daysUntilExpiration = differenceInDays(nextRenewalDate, today);
      expirationType = 'renewal';
    }

    // Only include if within threshold and not already expired (negative days)
    if (daysUntilExpiration >= 0 && daysUntilExpiration <= daysThreshold) {
      // Determine urgency level
      let urgencyLevel: 'critical' | 'high' | 'medium';
      if (daysUntilExpiration <= 1) {
        urgencyLevel = 'critical';
      } else if (daysUntilExpiration <= 3) {
        urgencyLevel = 'high';
      } else {
        urgencyLevel = 'medium';
      }

      expiringSubscriptions.push({
        ...subscription,
        daysUntilExpiration,
        expirationType,
        urgencyLevel,
      });
    }
  }

  // Sort by urgency (critical first) and then by days until expiration
  return expiringSubscriptions.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }
    
    return a.daysUntilExpiration - b.daysUntilExpiration;
  });
};

/**
 * Check if user should be shown expiration notifications
 * @param expiringSubscriptions - Array of expiring subscriptions
 * @param lastShownTime - Timestamp of when notifications were last shown
 * @returns boolean indicating whether to show notifications
 */
export const shouldShowExpirationNotifications = (
  expiringSubscriptions: ExpiringSubscription[],
  lastShownTime?: number
): boolean => {
  // Always show if there are critical subscriptions (expiring today/tomorrow)
  const criticalSubscriptions = expiringSubscriptions.filter(
    sub => sub.urgencyLevel === 'critical'
  );
  
  if (criticalSubscriptions.length > 0) {
    return true;
  }

  // Don't show if no expiring subscriptions
  if (expiringSubscriptions.length === 0) {
    return false;
  }

  // Don't show more than once per day for non-critical alerts
  if (lastShownTime) {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (lastShownTime > oneDayAgo) {
      return false;
    }
  }

  return true;
};

/**
 * Get summary message for expiring subscriptions
 * @param expiringSubscriptions - Array of expiring subscriptions
 * @returns Summary message string
 */
export const getExpirationSummary = (expiringSubscriptions: ExpiringSubscription[]): string => {
  const critical = expiringSubscriptions.filter(sub => sub.urgencyLevel === 'critical').length;
  const high = expiringSubscriptions.filter(sub => sub.urgencyLevel === 'high').length;
  const medium = expiringSubscriptions.filter(sub => sub.urgencyLevel === 'medium').length;

  if (critical > 0) {
    return `${critical} subscription${critical !== 1 ? 's' : ''} expiring ${critical === 1 ? 'today or tomorrow' : 'very soon'}!`;
  }

  if (high > 0) {
    return `${high} subscription${high !== 1 ? 's' : ''} expiring within 3 days`;
  }

  if (medium > 0) {
    return `${medium} subscription${medium !== 1 ? 's' : ''} expiring this week`;
  }

  return 'No urgent subscription alerts';
};