'use client';

import { useState } from 'react';
import { MeasureForm } from './MeasureForm';
import { MeasureList } from './MeasureList';
import { Button } from '@/components/ui/Button';
import type { SurveyQuestion } from '@/lib/types/database';
import { Plus, BarChart3 } from 'lucide-react';

// Simple type for goals linked to measures
type LinkedGoal = {
  id: string;
  title: string;
  measure_id: string | null;
  status: string;
};

interface SettingsPageClientProps {
  measures: SurveyQuestion[];
  goals: LinkedGoal[];
  userId: string;
}

export function SettingsPageClient({ measures, goals, userId }: SettingsPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<SurveyQuestion | null>(null);

  // Build map of measure_id to linked goals
  const linkedGoals: Record<string, LinkedGoal[]> = {};
  goals.forEach(goal => {
    if (goal.measure_id) {
      if (!linkedGoals[goal.measure_id]) {
        linkedGoals[goal.measure_id] = [];
      }
      linkedGoals[goal.measure_id].push(goal);
    }
  });

  const handleEdit = (measure: SurveyQuestion) => {
    setEditingMeasure(measure);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMeasure(null);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingMeasure(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your goal tracker</p>
        </div>
      </div>

      {/* Measures Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Check-in Measures</h2>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Measure
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Measures are questions you answer in your daily check-in. Link them to goals to track progress on specific objectives.
        </p>

        {/* Form */}
        {showForm && (
          <MeasureForm
            userId={userId}
            editingMeasure={editingMeasure || undefined}
            onCancel={handleCancel}
            onSaved={handleSaved}
          />
        )}

        {/* List */}
        <MeasureList
          measures={measures}
          linkedGoals={linkedGoals}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
