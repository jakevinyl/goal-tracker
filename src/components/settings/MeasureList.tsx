'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion } from '@/lib/types/database';

// Simplified type for linked goals (only fields we need)
type LinkedGoal = {
  id: string;
  title: string;
  measure_id: string | null;
  status: string;
};
import {
  BarChart3,
  Pencil,
  Trash2,
  Target,
  CheckCircle,
  XCircle,
  GripVertical
} from 'lucide-react';

interface MeasureListProps {
  measures: SurveyQuestion[];
  linkedGoals: Record<string, LinkedGoal[]>; // Map of measure_id to goals
  onEdit: (measure: SurveyQuestion) => void;
}

export function MeasureList({ measures, linkedGoals, onEdit }: MeasureListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (measure: SurveyQuestion) => {
    const linked = linkedGoals[measure.id];
    if (linked && linked.length > 0) {
      const goalNames = linked.map(g => g.title).join(', ');
      if (!confirm(`This measure is linked to: ${goalNames}\n\nDeleting will remove these links. Continue?`)) {
        return;
      }
    } else if (!confirm(`Delete "${measure.question_text}"?`)) {
      return;
    }

    setLoadingId(measure.id);

    const { error } = await supabase
      .from('survey_questions')
      .delete()
      .eq('id', measure.id);

    if (error) {
      console.error('Error deleting measure:', error);
      alert('Failed to delete measure');
    }

    setLoadingId(null);
    router.refresh();
  };

  const handleToggleActive = async (measure: SurveyQuestion) => {
    setLoadingId(measure.id);

    const { error } = await supabase
      .from('survey_questions')
      .update({ is_active: !measure.is_active })
      .eq('id', measure.id);

    if (error) {
      console.error('Error updating measure:', error);
      alert('Failed to update measure');
    }

    setLoadingId(null);
    router.refresh();
  };

  if (measures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Measures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No measures yet. Add one to start tracking in your daily check-ins.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeMeasures = measures.filter(m => m.is_active);
  const inactiveMeasures = measures.filter(m => !m.is_active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Measures ({measures.length})</CardTitle>
          <span className="text-sm text-gray-500">
            {activeMeasures.length} active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Active measures first */}
          {activeMeasures.map((measure) => (
            <MeasureItem
              key={measure.id}
              measure={measure}
              linkedGoals={linkedGoals[measure.id] || []}
              isLoading={loadingId === measure.id}
              onEdit={() => onEdit(measure)}
              onDelete={() => handleDelete(measure)}
              onToggleActive={() => handleToggleActive(measure)}
            />
          ))}

          {/* Inactive measures */}
          {inactiveMeasures.length > 0 && (
            <>
              <div className="border-t pt-2 mt-4">
                <p className="text-xs text-gray-500 mb-2">Inactive measures:</p>
              </div>
              {inactiveMeasures.map((measure) => (
                <MeasureItem
                  key={measure.id}
                  measure={measure}
                  linkedGoals={linkedGoals[measure.id] || []}
                  isLoading={loadingId === measure.id}
                  onEdit={() => onEdit(measure)}
                  onDelete={() => handleDelete(measure)}
                  onToggleActive={() => handleToggleActive(measure)}
                />
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MeasureItem({
  measure,
  linkedGoals,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive
}: {
  measure: SurveyQuestion;
  linkedGoals: LinkedGoal[];
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        measure.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag handle placeholder */}
        <div className="flex-shrink-0 text-gray-300 mt-1">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          measure.is_active ? 'bg-purple-100' : 'bg-gray-100'
        }`}>
          <BarChart3 className={`w-4 h-4 ${measure.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${measure.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
            {measure.question_text}
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-1">
            {/* Baseline/Target */}
            <span className="text-xs text-gray-500">
              Baseline: {measure.baseline_score}
              {measure.target_score && ` → Target: ${measure.target_score}`}
            </span>

            {/* Linked goals */}
            {linkedGoals.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                <Target className="w-3 h-3 mr-1" />
                {linkedGoals.length} goal{linkedGoals.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Show linked goal names */}
          {linkedGoals.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Linked to: {linkedGoals.map(g => g.title).join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleActive}
            disabled={isLoading}
            className={`p-1.5 rounded ${
              measure.is_active
                ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={measure.is_active ? 'Deactivate' : 'Activate'}
          >
            {measure.is_active ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
