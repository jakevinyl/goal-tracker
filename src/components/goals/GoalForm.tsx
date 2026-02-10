'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Bucket, Goal, SurveyQuestion } from '@/lib/types/database';
import { Target, X } from 'lucide-react';

interface GoalFormProps {
  buckets: Bucket[];
  questions: SurveyQuestion[];
  goals: Goal[]; // For parent goal selection
  userId: string;
  editingGoal?: Goal & { bucket?: Bucket; measure?: SurveyQuestion };
  onCancel?: () => void;
  onSaved?: () => void;
}

export function GoalForm({
  buckets,
  questions,
  goals,
  userId,
  editingGoal,
  onCancel,
  onSaved
}: GoalFormProps) {
  const [title, setTitle] = useState(editingGoal?.title || '');
  const [description, setDescription] = useState(editingGoal?.description || '');
  const [notes, setNotes] = useState(editingGoal?.notes || '');
  const [bucketId, setBucketId] = useState(editingGoal?.bucket_id || '');
  const [parentGoalId, setParentGoalId] = useState(editingGoal?.parent_goal_id || '');
  const [measureId, setMeasureId] = useState(editingGoal?.measure_id || '');
  const [status, setStatus] = useState<Goal['status']>(editingGoal?.status || 'not_started');
  const [priority, setPriority] = useState<Goal['priority']>(editingGoal?.priority || 'medium');
  const [targetDate, setTargetDate] = useState(editingGoal?.target_date || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Filter goals for parent selection (exclude self and sub-goals)
  const availableParentGoals = goals.filter(g =>
    g.id !== editingGoal?.id &&
    g.parent_goal_id !== editingGoal?.id &&
    !g.parent_goal_id // Only top-level goals can be parents
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !bucketId) {
      alert('Please enter a title and select a life area');
      return;
    }

    setIsSubmitting(true);

    const goalData = {
      user_id: userId,
      bucket_id: bucketId,
      parent_goal_id: parentGoalId || null,
      measure_id: measureId || null,
      title: title.trim(),
      description: description.trim() || null,
      notes: notes.trim() || null,
      status,
      priority,
      target_date: targetDate || null,
      progress_percent: editingGoal?.progress_percent || 0,
    };

    let error;

    if (editingGoal) {
      // Update existing
      const result = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', editingGoal.id);
      error = result.error;
    } else {
      // Create new
      const result = await supabase
        .from('goals')
        .insert(goalData);
      error = result.error;
    }

    if (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    } else {
      // Reset form if creating new
      if (!editingGoal) {
        setTitle('');
        setDescription('');
        setNotes('');
        setBucketId('');
        setParentGoalId('');
        setMeasureId('');
        setStatus('not_started');
        setPriority('medium');
        setTargetDate('');
      }
      onSaved?.();
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>{editingGoal ? 'Edit Goal' : 'Create Goal'}</span>
          </CardTitle>
          {onCancel && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this goal important? What does success look like?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Life Area and Parent Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Life Area *
              </label>
              <select
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select area...</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Goal (optional)
              </label>
              <select
                value={parentGoalId}
                onChange={(e) => setParentGoalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No parent (top-level)</option>
                {availableParentGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Goal['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Goal['priority'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Measure (Daily Check-in Question) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linked Measure (Daily Check-in)
            </label>
            <select
              value={measureId}
              onChange={(e) => setMeasureId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No linked measure</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.question_text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This question will be highlighted in your daily check-in while the goal is active.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes & Progress Updates
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Track your thoughts, progress, blockers..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
