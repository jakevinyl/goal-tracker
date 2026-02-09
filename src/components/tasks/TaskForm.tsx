'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Bucket, Goal } from '@/lib/types/database';
import { Plus, X } from 'lucide-react';

interface TaskFormProps {
  buckets: Bucket[];
  goals?: Goal[];
  userId: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function TaskForm({ buckets, goals = [], userId, onClose, isModal = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bucketId, setBucketId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isModal);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (!bucketId) {
      alert('Please select a bucket');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        bucket_id: bucketId,
        goal_id: goalId || null,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
        status: 'open',
      });

    if (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setBucketId('');
      setGoalId('');
      setPriority('medium');
      setDueDate('');
      setIsRecurring(false);
      setRecurrenceRule('');
      if (!isModal) setIsExpanded(false);
      if (onClose) onClose();
      router.refresh();
    }

    setIsSubmitting(false);
  };

  // Quick add mode (collapsed)
  if (!isExpanded && !isModal) {
    return (
      <Card>
        <CardContent className="py-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add a task...</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  const filteredGoals = goals.filter(g => g.bucket_id === bucketId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </CardTitle>
          {!isModal && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
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
              Task
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Bucket & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bucket
              </label>
              <select
                value={bucketId}
                onChange={(e) => {
                  setBucketId(e.target.value);
                  setGoalId(''); // Reset goal when bucket changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date & Goal Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {bucketId && filteredGoals.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Goal
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None</option>
                  {filteredGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Recurring task</span>
            </label>

            {isRecurring && (
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select frequency...</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Add Task
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
