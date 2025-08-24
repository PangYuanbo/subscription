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
  
  const filteredData = allProjectedData.filter((_, index) => {
    if (timeRange === "3m") return index >= 9;
    if (timeRange === "6m") return index >= 6;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary Overview Header */}
      <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/30 backdrop-blur-sm rounded-xl border border-slate-200/30 shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100/60">
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Subscription Overview</h2>
              <p className="text-sm text-slate-600">Your spending summary and key metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Total</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">${data.total_monthly_cost.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">per month</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Annual Total</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">${data.total_annual_cost.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">per year</p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Services</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{data.service_count}</p>
                  <p className="text-xs text-slate-500 mt-1">subscription{data.service_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-slate-800 text-lg font-semibold">Cost Breakdown by Category</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                See where your money goes each month
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="mb-4">
            <div className="text-sm text-slate-500 text-center">
              {validCategoryData.length} categories • Total: ${validCategoryData.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                  </linearGradient>
                ))}
                <filter id="pieShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.15)"/>
                </filter>
              </defs>
              <Pie
                data={validCategoryData}
                cx="40%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                innerRadius={30}
                fill="#8884d8"
                dataKey="total"
                filter="url(#pieShadow)"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {validCategoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#gradient${index % COLORS.length})`} />
                ))}
              </Pie>
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const total = validCategoryData.reduce((sum, item) => sum + item.total, 0);
                    const percentage = ((data.total / total) * 100).toFixed(1);
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-xl">
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: payload[0].color }}
                            />
                            <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                              {data.category}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-center">
                          <div>
                            <span className="text-lg font-bold text-slate-800">
                              ${Number(data.total).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">
                              {percentage}% of total spending
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
                iconSize={10}
                wrapperStyle={{
                  paddingLeft: "30px",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
                formatter={(_, entry) => {
                  if (!entry?.payload) return '';
                  const payload = entry.payload as any;
                  const percentage = ((payload.total / validCategoryData.reduce((sum, item) => sum + item.total, 0)) * 100).toFixed(0);
                  return (
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{payload.category}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>({percentage}%)</span>
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-lg border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Top Category</p>
                <p className="text-lg font-bold text-emerald-600">
                  {validCategoryData.length > 0 ? 
                    validCategoryData.reduce((max, item) => item.total > max.total ? item : max, validCategoryData[0]).category
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Categories</p>
                <p className="text-lg font-bold text-slate-800">
                  {validCategoryData.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-slate-800 text-lg font-semibold">Monthly Spending Trends</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Track your spending patterns with beautiful insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <span className="text-sm font-medium text-slate-700">Projected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <span className="text-sm font-medium text-slate-700">Actual</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {data.monthly_trend.length} months of data
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthly_trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                vertical={false} 
                opacity={0.6}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={12}
                fontWeight={500}
                fill="#64748b"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={12}
                fontWeight={500}
                fill="#64748b"
                tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-xl">
                        <div className="text-center mb-3">
                          <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                            {label} 2024
                          </span>
                        </div>
                        <div className="space-y-2">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm font-medium text-slate-700">
                                  {entry.name === 'projected' ? 'Projected' : 'Actual'}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-slate-800">
                                ${Number(entry.value).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {payload.length === 2 && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Difference</span>
                              <span className={`text-xs font-semibold ${
                                (payload[1]?.value || 0) > (payload[0]?.value || 0) 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                ${Math.abs((payload[1]?.value || 0) - (payload[0]?.value || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="projected" 
                fill="url(#projectedGradient)" 
                name="projected" 
                radius={[6, 6, 0, 0]}
                filter="url(#shadow)"
                maxBarSize={60}
              />
              <Bar 
                dataKey="actual" 
                fill="url(#actualGradient)" 
                name="actual" 
                radius={[6, 6, 0, 0]}
                filter="url(#shadow)"
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Monthly</p>
                <p className="text-lg font-bold text-slate-800">
                  ${(data.monthly_trend.reduce((sum, item) => sum + (item.actual || item.projected || 0), 0) / data.monthly_trend.length).toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Highest</p>
                <p className="text-lg font-bold text-emerald-600">
                  ${Math.max(...data.monthly_trend.map(item => item.actual || item.projected || 0)).toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Lowest</p>
                <p className="text-lg font-bold text-blue-600">
                  ${Math.min(...data.monthly_trend.map(item => item.actual || item.projected || 0)).toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Trend</p>
                <p className="text-lg font-bold text-indigo-600">
                  {data.monthly_trend.length >= 2 ? 
                    ((data.monthly_trend[data.monthly_trend.length - 1]?.actual || 0) > 
                     (data.monthly_trend[0]?.actual || 0) ? '↗️' : '↘️') : '➖'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-slate-800 text-lg font-semibold">Annual Cost Projection</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Forecast your spending with intelligent predictions
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-inner border border-slate-200">
              {['3m', '6m', '12m'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    timeRange === range 
                      ? "bg-purple-500 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <span className="text-sm font-medium text-slate-700">Projected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <span className="text-sm font-medium text-slate-700">Actual</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Showing {filteredData.length} months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="fillProjectedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillActualArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.1} />
                </linearGradient>
                <filter id="areaShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                vertical={false} 
                opacity={0.6}
              />
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={12}
                fontSize={12}
                fontWeight={500}
                fill="#64748b"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={12}
                fontSize={12}
                fontWeight={500}
                fill="#64748b"
                tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              />
              <Tooltip
                cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeOpacity: 0.5 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-xl">
                        <div className="text-center mb-3">
                          <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                            {label} 2024
                          </span>
                        </div>
                        <div className="space-y-2">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shadow-sm"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm font-medium text-slate-700">
                                  {entry.name === 'projected' ? 'Projected' : 'Actual'}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-slate-800">
                                ${Number(entry.value || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {payload.length === 2 && payload.every(p => p.value !== null) && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Accuracy</span>
                              <span className="text-xs font-semibold text-purple-600">
                                {(100 - Math.abs(((payload[1]?.value || 0) - (payload[0]?.value || 0)) / (payload[0]?.value || 1) * 100)).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey="projected"
                type="monotone"
                fill="url(#fillProjectedArea)"
                stroke="#8b5cf6"
                strokeWidth={3}
                strokeDasharray="8 4"
                name="projected"
                filter="url(#areaShadow)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 3, stroke: '#ffffff', filter: 'url(#areaShadow)' }}
              />
              <Area
                dataKey="actual"
                type="monotone"
                fill="url(#fillActualArea)"
                stroke="#10b981"
                strokeWidth={3}
                name="actual"
                filter="url(#areaShadow)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#ffffff', filter: 'url(#areaShadow)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-lg border border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Projection</p>
                <p className="text-lg font-bold text-purple-600">
                  ${(data.total_monthly_cost * 12).toFixed(0)}
                </p>
                <p className="text-xs text-slate-400">annual</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Monthly Avg</p>
                <p className="text-lg font-bold text-slate-800">
                  ${data.total_monthly_cost.toFixed(0)}
                </p>
                <p className="text-xs text-slate-400">per month</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Period</p>
                <p className="text-lg font-bold text-indigo-600">
                  {timeRange}
                </p>
                <p className="text-xs text-slate-400">selected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      </div>

      {/* Monthly Spending Input Section */}
      {onMonthlySpendingUpdate && (
        <div className="mt-6">
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