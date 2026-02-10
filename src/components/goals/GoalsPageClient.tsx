'use client';

import { useState } from 'react';
import { GoalForm } from './GoalForm';
import { GoalList } from './GoalList';
import { Button } from '@/components/ui/Button';
import type { Goal, Bucket, SurveyQuestion } from '@/lib/types/database';
import { Plus } from 'lucide-react';

type GoalWithRelations = Goal & {
  bucket?: Bucket;
  measure?: SurveyQuestion;
  sub_goals?: GoalWithRelations[];
};

interface GoalsPageClientProps {
  goals: GoalWithRelations[];
  buckets: Bucket[];
  questions: SurveyQuestion[];
  userId: string;
}

export function GoalsPageClient({ goals, buckets, questions, userId }: GoalsPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Organize goals into hierarchy (top-level with sub-goals nested)
  const organizeGoals = (goalList: GoalWithRelations[]): GoalWithRelations[] => {
    const goalMap = new Map<string, GoalWithRelations>();
    const topLevel: GoalWithRelations[] = [];

    // First pass: create map
    goalList.forEach(goal => {
      goalMap.set(goal.id, { ...goal, sub_goals: [] });
    });

    // Second pass: organize hierarchy
    goalList.forEach(goal => {
      const goalWithSubs = goalMap.get(goal.id)!;
      if (goal.parent_goal_id && goalMap.has(goal.parent_goal_id)) {
        goalMap.get(goal.parent_goal_id)!.sub_goals!.push(goalWithSubs);
      } else {
        topLevel.push(goalWithSubs);
      }
    });

    return topLevel;
  };

  const activeGoals = organizeGoals(
    goals.filter(g => g.status !== 'complete' && g.status !== 'archived')
  );
  const completedGoals = organizeGoals(
    goals.filter(g => g.status === 'complete')
  );

  const handleEdit = (goal: GoalWithRelations) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  // Flat list for parent selection (excluding sub-goals of the editing goal)
  const flatGoals = goals.filter(g => g.status !== 'complete' && g.status !== 'archived');

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals & Milestones</h1>
          <p className="text-gray-500">Track your high-level objectives</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        )}
      </div>

      {/* Form (create or edit) */}
      {showForm && (
        <GoalForm
          buckets={buckets}
          questions={questions}
          goals={flatGoals}
          userId={userId}
          editingGoal={editingGoal || undefined}
          onCancel={handleCancel}
          onSaved={handleSaved}
        />
      )}

      {/* Active Goals */}
      <GoalList
        goals={activeGoals}
        title={`Active Goals (${activeGoals.length})`}
        onEdit={handleEdit}
      />

      {/* Completed Goals Toggle */}
      {completedGoals.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            <span>{showCompleted ? 'Hide' : 'Show'} completed ({completedGoals.length})</span>
          </button>

          {showCompleted && (
            <div className="mt-4">
              <GoalList
                goals={completedGoals}
                title={`Completed Goals (${completedGoals.length})`}
                onEdit={handleEdit}
                showCompleted
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
