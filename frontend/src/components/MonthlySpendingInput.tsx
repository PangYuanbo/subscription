import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [isEditing, setIsEditing] = useState(false);

  const handleActualSpendingChange = (index: number, value: string) => {
    const updatedData = [...editingData];
    const numValue = parseFloat(value) || undefined;
    updatedData[index] = { ...updatedData[index], actual: numValue };
    setEditingData(updatedData);
  };

  const handleSave = () => {
    onUpdate(editingData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingData(monthlyData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditingData(monthlyData);
    setIsEditing(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Spending Input</CardTitle>
        <div className="space-x-2">
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="sm">
              Edit Actual Spending
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} size="sm">
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
            <div>Month</div>
            <div>Projected</div>
            <div>Actual Spending</div>
          </div>
          {editingData.map((item, index) => (
            <div key={`${item.month}-${item.year}`} className="grid grid-cols-3 gap-4 items-center">
              <div className="text-sm font-medium">
                {item.month} {item.year}
              </div>
              <div className="text-sm text-gray-600">
                ${(item.projected || 0).toFixed(2)}
              </div>
              <div>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter actual spending"
                    value={item.actual || ''}
                    onChange={(e) => handleActualSpendingChange(index, e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <span className={`text-sm ${item.actual ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {item.actual ? `$${item.actual.toFixed(2)}` : 'Not recorded'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {!isEditing && (
          <div className="mt-4 text-xs text-gray-500">
            Tip: Click "Edit Actual Spending" to record your actual monthly expenses and compare them with projected costs.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlySpendingInput;