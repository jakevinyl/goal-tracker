'use client';

import { useState } from 'react';
import { MeasureForm } from './MeasureForm';
import { MeasureList } from './MeasureList';
import { Button } from '@/components/ui/Button';
import type { SurveyQuestion } from '@/lib/types/database';
import { Plus, Gauge } from 'lucide-react';

// Type for goals linked to measures
export type LinkedGoal = {
  id: string;
  title: string;
  measure_id: string | null;
  status: string;
  target_type: 'average' | 'count' | null;
  target_value: number | null;
};

interface MeasuresPageClientProps {
  measures: SurveyQuestion[];
  goals: LinkedGoal[];
  userId: string;
}

export function MeasuresPageClient({ measures, goals, userId }: MeasuresPageClientProps) {
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

  // Separate measures by type
  const scaleMeasures = measures.filter(m => m.question_type !== 'binary');
  const binaryMeasures = measures.filter(m => m.question_type === 'binary');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Measures</h1>
          <p className="text-gray-500">Track progress with daily check-in questions</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Measure
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Gauge className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="text-sm text-indigo-800">
            <p className="font-medium">Two types of measures:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-indigo-700">
              <li><strong>Scale (1-10)</strong> — Rate yourself daily, track average over time</li>
              <li><strong>Binary (Yes/No)</strong> — Track if you did something, count occurrences</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <MeasureForm
          userId={userId}
          editingMeasure={editingMeasure || undefined}
          onCancel={handleCancel}
          onSaved={handleSaved}
        />
      )}

      {/* Scale Measures */}
      {scaleMeasures.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Scale Measures (1-10)</span>
          </h2>
          <MeasureList
            measures={scaleMeasures}
            linkedGoals={linkedGoals}
            onEdit={handleEdit}
          />
        </div>
      )}

      {/* Binary Measures */}
      {binaryMeasures.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Binary Measures (Yes/No)</span>
          </h2>
          <MeasureList
            measures={binaryMeasures}
            linkedGoals={linkedGoals}
            onEdit={handleEdit}
          />
        </div>
      )}

      {/* Empty state */}
      {measures.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No measures yet</h3>
          <p className="text-gray-500 mt-1">Create your first measure to start tracking progress</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Measure
          </Button>
        </div>
      )}
    </div>
  );
}
