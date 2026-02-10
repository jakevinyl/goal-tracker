'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { Goal, Bucket, SurveyQuestion } from '@/lib/types/database';
import {
  Target,
  Calendar,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  CheckCircle2,
  BarChart3,
  MessageSquare
} from 'lucide-react';

type GoalWithRelations = Goal & {
  bucket?: Bucket;
  measure?: SurveyQuestion;
  sub_goals?: GoalWithRelations[];
};

interface GoalListProps {
  goals: GoalWithRelations[];
  title: string;
  onEdit: (goal: GoalWithRelations) => void;
  showCompleted?: boolean;
}

export function GoalList({ goals, title, onEdit, showCompleted = false }: GoalListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDelete = async (goal: GoalWithRelations) => {
    const hasSubGoals = goal.sub_goals && goal.sub_goals.length > 0;
    const message = hasSubGoals
      ? `Delete "${goal.title}" and all its sub-goals?`
      : `Delete "${goal.title}"?`;

    if (!confirm(message)) return;

    setLoadingId(goal.id);

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goal.id);

    if (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }

    setLoadingId(null);
    router.refresh();
  };

  const handleStatusChange = async (goal: GoalWithRelations, newStatus: Goal['status']) => {
    setLoadingId(goal.id);

    const updateData: Partial<Goal> = { status: newStatus };
    if (newStatus === 'complete') {
      updateData.completed_date = new Date().toISOString().split('T')[0];
    } else {
      updateData.completed_date = null;
    }

    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goal.id);

    if (error) {
      console.error('Error updating goal status:', error);
      alert('Failed to update status');
    }

    setLoadingId(null);
    router.refresh();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIndicator = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return <span className="w-2 h-2 rounded-full bg-red-500" title="High priority" />;
      case 'medium': return <span className="w-2 h-2 rounded-full bg-yellow-500" title="Medium priority" />;
      default: return null;
    }
  };

  // Recursively render goal with sub-goals
  const renderGoal = (goal: GoalWithRelations, depth: number = 0) => {
    const hasSubGoals = goal.sub_goals && goal.sub_goals.length > 0;
    const isExpanded = expandedIds.has(goal.id);
    const isLoading = loadingId === goal.id;

    return (
      <div key={goal.id} className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}>
        <div
          className={`p-4 rounded-lg border ${
            goal.status === 'complete'
              ? 'bg-green-50 border-green-200'
              : goal.status === 'archived'
              ? 'bg-gray-50 border-gray-200 opacity-60'
              : 'bg-white border-gray-200'
          } ${depth > 0 ? 'mt-2' : ''}`}
        >
          {/* Main row */}
          <div className="flex items-start space-x-3">
            {/* Expand/collapse for goals with sub-goals */}
            <div className="flex-shrink-0 w-6 mt-0.5">
              {hasSubGoals ? (
                <button
                  onClick={() => toggleExpand(goal.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${goal.bucket?.color}20` }}
                >
                  <Target className="w-3 h-3" style={{ color: goal.bucket?.color }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                {getPriorityIndicator(goal.priority)}
                <h3 className={`font-medium ${
                  goal.status === 'complete' ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}>
                  {goal.title}
                </h3>
                {hasSubGoals && (
                  <span className="text-xs text-gray-500">
                    ({goal.sub_goals!.length} sub-goals)
                  </span>
                )}
              </div>

              {goal.description && (
                <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
              )}

              {/* Meta info */}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                {/* Bucket */}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${goal.bucket?.color}20`,
                    color: goal.bucket?.color
                  }}
                >
                  {goal.bucket?.name}
                </span>

                {/* Status */}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status.replace('_', ' ')}
                </span>

                {/* Target date */}
                {goal.target_date && (
                  <span className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(goal.target_date)}
                  </span>
                )}

                {/* Linked measure */}
                {goal.measure && (
                  <span className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Has measure
                  </span>
                )}
              </div>

              {/* Notes preview */}
              {goal.notes && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1 flex items-start space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{goal.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {goal.status !== 'complete' && goal.status !== 'archived' && (
                <button
                  onClick={() => handleStatusChange(goal, 'complete')}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-green-500"
                  title="Mark complete"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(goal)}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-blue-500"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(goal)}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-goals */}
        {hasSubGoals && isExpanded && (
          <div className="mt-2 space-y-2">
            {goal.sub_goals!.map(subGoal => renderGoal(subGoal, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            {showCompleted ? 'No completed goals yet.' : 'No active goals. Create one to get started!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-sm text-gray-500">{goals.length} goals</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {goals.map(goal => renderGoal(goal))}
        </div>
      </CardContent>
    </Card>
  );
}
