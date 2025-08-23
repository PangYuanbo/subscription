import React from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MonthlySpendingInput from './MonthlySpendingInput';
import type { Analytics as AnalyticsData, MonthlySpending } from '@/types';

interface AnalyticsProps {
  data: AnalyticsData;
  onMonthlySpendingUpdate?: (updatedData: MonthlySpending[]) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics: React.FC<AnalyticsProps> = ({ data, onMonthlySpendingUpdate }) => {
  const [timeRange, setTimeRange] = React.useState("12m");
  
  // Filter out categories with name "0" and prepare data for pie chart
  const validCategoryData = data.category_breakdown.filter(item => item.category !== "0");
  
  const allProjectedData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i);
    return {
      date: date.toISOString().split('T')[0],
      month: date.toLocaleString('default', { month: 'short' }),
      projected: data.total_monthly_cost,
      actual: i < data.monthly_trend.length ? data.monthly_trend[i]?.actual || null : null,
    };
  });
  
  const filteredData = allProjectedData.filter((item, index) => {
    if (timeRange === "3m") return index >= 9;
    if (timeRange === "6m") return index >= 6;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={validCategoryData}
                cx="40%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {validCategoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: payload[0].color }}
                            />
                            <span className="text-sm font-medium">
                              {data.category}: ${Number(data.total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="middle" 
                align="right" 
                layout="vertical"
                iconSize={8}
                wrapperStyle={{
                  paddingLeft: "20px",
                  fontSize: "14px"
                }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: "12px" }}>
                    {value}: ${Number(entry.payload.total).toFixed(2)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name === 'projected' ? 'Projected' : 'Actual']} />
              <Bar dataKey="projected" fill="#3b82f6" name="Projected" />
              <Bar dataKey="actual" fill="#10b981" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Projected Annual Costs</CardTitle>
            <CardDescription>
              Showing projected vs actual costs over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("12m")}
              className={`px-3 py-1 text-sm rounded ${timeRange === "12m" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              12m
            </button>
            <button
              onClick={() => setTimeRange("6m")}
              className={`px-3 py-1 text-sm rounded ${timeRange === "6m" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              6m
            </button>
            <button
              onClick={() => setTimeRange("3m")}
              className={`px-3 py-1 text-sm rounded ${timeRange === "3m" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              3m
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Tooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {label}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-1">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium">
                                {entry.name}: ${Number(entry.value || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey="projected"
                type="natural"
                fill="url(#fillProjected)"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                stackId="a"
                name="Projected"
              />
              <Area
                dataKey="actual"
                type="natural"
                fill="url(#fillActual)"
                stroke="#10b981"
                strokeWidth={2}
                stackId="a"
                name="Actual"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Monthly Cost</p>
              <p className="text-2xl font-bold">${data.total_monthly_cost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Annual Cost</p>
              <p className="text-2xl font-bold">${data.total_annual_cost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Service Count</p>
              <p className="text-2xl font-bold">{data.service_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {onMonthlySpendingUpdate && (
        <div className="lg:col-span-2 xl:col-span-3">
          <MonthlySpendingInput
            monthlyData={data.monthly_trend}
            onUpdate={onMonthlySpendingUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default Analytics;