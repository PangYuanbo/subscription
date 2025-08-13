import React from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Analytics as AnalyticsData } from '@/types';

interface AnalyticsProps {
  data: AnalyticsData;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  const projectedAnnualData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
    projected: data.total_monthly_cost,
    actual: i < 6 ? data.monthly_trend[i]?.total || 0 : null,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.category_breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, total }) => `${category}: $${total.toFixed(2)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {data.category_breakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projected Annual Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectedAnnualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => value ? `$${value}` : 'N/A'} />
              <Legend />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#3b82f6"
                strokeDasharray="5 5"
                name="Projected"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                name="Actual"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Monthly Cost</p>
              <p className="text-2xl font-bold text-green-600">
                ${data.total_monthly_cost.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Projected Annual Cost</p>
              <p className="text-2xl font-bold text-blue-600">
                ${data.total_annual_cost.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-purple-600">{data.service_count}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Average Cost</p>
              <p className="text-2xl font-bold text-orange-600">
                ${data.service_count > 0 ? (data.total_monthly_cost / data.service_count).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;