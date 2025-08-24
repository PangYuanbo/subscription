import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, TrendingUp, TrendingDown, Calendar, DollarSign, Edit3, Save } from 'lucide-react';
import type { MonthlySpending } from '@/types';

interface MonthlySpendingInputProps {
  monthlyData: MonthlySpending[];
  onUpdate: (updatedData: MonthlySpending[]) => void;
}

const MonthlySpendingInput: React.FC<MonthlySpendingInputProps> = ({
  monthlyData,
  onUpdate,
}) => {
  const [editingData, setEditingData] = useState<MonthlySpending[]>(monthlyData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setEditingData(monthlyData);
    setHasChanges(false);
  }, [monthlyData]);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setTempValue(editingData[index].actual?.toString() || '');
  };

  const handleSaveEdit = (index: number) => {
    const updatedData = [...editingData];
    const numValue = parseFloat(tempValue) || undefined;
    updatedData[index] = { ...updatedData[index], actual: numValue };
    setEditingData(updatedData);
    setEditingIndex(null);
    setHasChanges(true);
    setTempValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setTempValue('');
  };

  const handleSaveAll = () => {
    onUpdate(editingData);
    setHasChanges(false);
  };

  const handleResetAll = () => {
    setEditingData(monthlyData);
    setHasChanges(false);
    setEditingIndex(null);
  };

  const calculateDifference = (projected: number, actual?: number) => {
    if (!actual) return null;
    return actual - projected;
  };

  const getMonthStatus = (projected: number, actual?: number) => {
    if (!actual) return 'pending';
    const diff = calculateDifference(projected, actual);
    if (diff === null) return 'pending';
    if (diff <= 0) return 'saved';
    return 'overspent';
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-slate-800 text-lg font-semibold">
                Actual Spending Tracker
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Track your actual monthly expenses against projections
              </CardDescription>
            </div>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAll}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleResetAll}
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50"
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wide pb-3 border-b border-slate-100">
            <div className="col-span-2">Month</div>
            <div className="col-span-3">Projected</div>
            <div className="col-span-4">Actual</div>
            <div className="col-span-2">Difference</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Data Rows */}
          {editingData.map((item, index) => {
            const status = getMonthStatus(item.projected || 0, item.actual);
            const difference = calculateDifference(item.projected || 0, item.actual);
            const isCurrentMonth = new Date().getMonth() === new Date(2024, index).getMonth();
            
            return (
              <div
                key={`${item.month}-${item.year}`}
                className={`grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg transition-all duration-200 ${
                  isCurrentMonth ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-200/50' : 
                  'hover:bg-slate-50/50'
                }`}
              >
                {/* Month */}
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className={`text-sm font-medium ${isCurrentMonth ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {item.month} {item.year}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>

                {/* Projected */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">
                      ${(item.projected || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actual */}
                <div className="col-span-4">
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="pl-8 pr-2 h-9 text-sm font-medium"
                          placeholder="0.00"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(index);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        onClick={() => handleSaveEdit(index)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className={`text-sm font-medium ${
                        item.actual ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {item.actual ? `$${item.actual.toFixed(2)}` : '—'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-indigo-100"
                        onClick={() => handleStartEdit(index)}
                      >
                        <Edit3 className="h-3 w-3 text-indigo-600" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Difference */}
                <div className="col-span-2">
                  {difference !== null && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      difference <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {difference <= 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      <span>${Math.abs(difference).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  {status === 'saved' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Saved
                    </span>
                  )}
                  {status === 'overspent' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Over
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-lg border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Projected</p>
              <p className="text-lg font-bold text-slate-800">
                ${editingData.reduce((sum, item) => sum + (item.projected || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Actual</p>
              <p className="text-lg font-bold text-indigo-600">
                ${editingData.reduce((sum, item) => sum + (item.actual || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Saved</p>
              <p className="text-lg font-bold text-green-600">
                ${Math.max(0, editingData.reduce((sum, item) => {
                  const diff = (item.projected || 0) - (item.actual || 0);
                  return sum + (diff > 0 ? diff : 0);
                }, 0)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Tracked</p>
              <p className="text-lg font-bold text-purple-600">
                {editingData.filter(item => item.actual !== undefined).length}/{editingData.length}
              </p>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <span className="font-semibold">Tip:</span>
            <span>Click the edit icon next to any month to record your actual spending. Press Enter to save or Escape to cancel.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySpendingInput;