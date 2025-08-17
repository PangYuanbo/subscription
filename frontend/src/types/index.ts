export interface Service {
  id: string;
  name: string;
  icon_url?: string;
  category: string;
}

export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  service_id: string;
  service?: Service;
  account: string;
  payment_date: string;
  cost: number; // 原价格，可能是月费或年费
  billing_cycle: BillingCycle; // 计费周期：月费或年费
  monthly_cost: number; // 计算出的月费用，用于统计
  created_at?: string;
  updated_at?: string;
  // 免费试用相关字段
  trial_start_date?: string;
  trial_end_date?: string;
  trial_duration_days?: number;
  is_trial?: boolean;
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