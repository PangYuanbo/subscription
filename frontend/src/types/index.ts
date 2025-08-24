export interface Service {
  id: string;
  name: string;
  icon_url?: string;
  icon_source_url?: string;  // URL where icon was fetched from
  category: string;
}

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  service_id: string;
  service?: Service;
  account: string;
  payment_date: string;
  cost: number; // Original price, may be monthly or yearly fee
  billing_cycle: BillingCycle; // Billing cycle: weekly, monthly or yearly fee
  monthly_cost: number; // Calculated monthly cost for statistics
  created_at?: string;
  updated_at?: string;
  // Free trial related fields
  trial_start_date?: string;
  trial_end_date?: string;
  trial_duration_days?: number;
  is_trial?: boolean;
  // Auto-renewal settings
  auto_pay?: boolean; // Whether the subscription automatically renews
}

export interface MonthlySpending {
  month: string;
  year: number;
  projected: number;
  actual?: number;
}

export interface Analytics {
  total_monthly_cost: number;
  total_annual_cost: number;
  category_breakdown: { category: string; total: number }[];
  monthly_trend: MonthlySpending[];
  service_count: number;
}