import type { Subscription } from '@/types';
import { differenceInDays, isAfter, parseISO, format } from 'date-fns';

export interface TrialStatus {
  isInTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  totalDays: number;
  statusText: string;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
}

export const calculateTrialStatus = (subscription: Subscription): TrialStatus | null => {
  if (!subscription.is_trial || !subscription.trial_start_date || !subscription.trial_end_date) {
    return null;
  }

  const today = new Date();
  const trialEndDate = parseISO(subscription.trial_end_date);
  const trialStartDate = parseISO(subscription.trial_start_date);
  
  const totalDays = differenceInDays(trialEndDate, trialStartDate);
  const daysRemaining = differenceInDays(trialEndDate, today);
  const isExpired = isAfter(today, trialEndDate);
  const isInTrial = !isExpired && daysRemaining >= 0;

  let statusText: string;
  let statusColor: 'green' | 'yellow' | 'red' | 'gray';

  if (isExpired) {
    statusText = '试用已过期';
    statusColor = 'red';
  } else if (daysRemaining === 0) {
    statusText = '今天到期';
    statusColor = 'red';
  } else if (daysRemaining <= 3) {
    statusText = `还剩 ${daysRemaining} 天`;
    statusColor = 'yellow';
  } else if (daysRemaining <= 7) {
    statusText = `还剩 ${daysRemaining} 天`;
    statusColor = 'yellow';
  } else {
    statusText = `还剩 ${daysRemaining} 天`;
    statusColor = 'green';
  }

  return {
    isInTrial,
    isExpired,
    daysRemaining,
    totalDays,
    statusText,
    statusColor,
  };
};

export const formatTrialPeriod = (startDate: string, endDate: string): string => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, 'yyyy/MM/dd')} - ${format(end, 'yyyy/MM/dd')}`;
};

export const getCommonTrialDurations = () => [
  { label: '7天', days: 7 },
  { label: '14天', days: 14 },
  { label: '30天', days: 30 },
  { label: '60天', days: 60 },
  { label: '90天', days: 90 },
];

export const calculateTrialEndDate = (startDate: string, durationDays: number): string => {
  const start = parseISO(startDate);
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + durationDays);
  return endDate.toISOString().split('T')[0];
};