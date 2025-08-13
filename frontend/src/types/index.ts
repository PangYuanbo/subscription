export interface Service {
  id: string;
  name: string;
  icon_url: string;
  category: string;
}

export interface Subscription {
  id: string;
  service_id: string;
  service?: Service;
  account: string;
  payment_date: string;
  monthly_cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface Analytics {
  total_monthly_cost: number;
  total_annual_cost: number;
  category_breakdown: { category: string; total: number }[];
  monthly_trend: { month: string; total: number }[];
  service_count: number;
}