'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion } from '@/lib/types/database';
import type { LinkedGoal } from './MeasuresPageClient';
import {
  Sliders,
  ToggleLeft,
  Target,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

interface MeasureListProps {
  measures: SurveyQuestion[];
  linkedGoals: Record<string, LinkedGoal[]>;
  onEdit: (measure: SurveyQuestion) => void;
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
  const isBinary = measure.question_type === 'binary';

  return (
    <Card className={`${!measure.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Type badge and question */}
            <div className="flex items-center space-x-2 mb-1">
              {isBinary ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <ToggleLeft className="w-3 h-3 mr-1" />
                  Yes/No
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  <Sliders className="w-3 h-3 mr-1" />
                  1-10
                </span>
              )}
              {!measure.is_active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
            </div>

            <h3 className="font-medium text-gray-900 truncate">
              {measure.question_text}
            </h3>

            {/* Scores for scale measures */}
            {!isBinary && (
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-gray-500">
                  Baseline: <span className="font-medium text-gray-700">{measure.baseline_score}</span>
                </span>
                {measure.target_score && (
                  <>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500">
                      Target: <span className="font-medium text-green-600">{measure.target_score}</span>
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Linked goals */}
            {linkedGoals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {linkedGoals.map(goal => (
                  <span
                    key={goal.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    {goal.title}
                    {goal.target_value && (
                      <span className="ml-1 text-purple-500">
                        ({goal.target_type === 'average' ? `avg ${goal.target_value}` : `${goal.target_value}×`})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={onToggleActive}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={measure.is_active ? 'Deactivate' : 'Activate'}
            >
              {measure.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onEdit}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MeasureList({ measures, linkedGoals, onEdit }: MeasureListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (measure: SurveyQuestion) => {
    const goalsLinked = linkedGoals[measure.id] || [];

    if (goalsLinked.length > 0) {
      const confirmed = confirm(
        `This measure is linked to ${goalsLinked.length} goal(s). Deleting it will remove the link. Continue?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm('Are you sure you want to delete this measure?');
      if (!confirmed) return;
    }

    setLoadingId(measure.id);

    const { error } = await supabase
      .from('survey_questions')
      .delete()
      .eq('id', measure.id);

    if (error) {
      console.error('Error deleting measure:', error);
      alert('Failed to delete measure');
    } else {
      router.refresh();
    }

    setLoadingId(null);
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
    } else {
      router.refresh();
    }

    setLoadingId(null);
  };

  if (measures.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {measures.map(measure => (
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
    </div>
  );
}
