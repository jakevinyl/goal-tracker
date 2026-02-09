'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { Task, Bucket } from '@/lib/types/database';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  RotateCcw,
  Calendar,
  Repeat,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TaskListProps {
  tasks: (Task & { buckets: Bucket })[];
  title: string;
  showCompleted?: boolean;
  emptyMessage?: string;
}

export function TaskList({ tasks, title, showCompleted = false, emptyMessage = "No tasks" }: TaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleToggleComplete = async (task: Task & { buckets: Bucket }) => {
    setLoadingId(task.id);

    if (task.status === 'complete') {
      // Reopen task
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'open', completed_at: null })
        .eq('id', task.id);

      if (error) {
        console.error('Error reopening task:', error);
        alert('Failed to reopen task');
      }
    } else {
      // Complete task
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString(),
          snoozed_until: null
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error completing task:', error);
        alert('Failed to complete task');
      }
    }

    setLoadingId(null);
    router.refresh();
  };

  const handleSnooze = async (taskId: string, days: number) => {
    setLoadingId(taskId);

    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'snoozed',
        snoozed_until: snoozeDate.toISOString().split('T')[0]
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error snoozing task:', error);
      alert('Failed to snooze task');
    }

    setLoadingId(null);
    setExpandedId(null);
    router.refresh();
  };

  const handleUnsnooze = async (taskId: string) => {
    setLoadingId(taskId);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'open', snoozed_until: null })
      .eq('id', taskId);

    if (error) {
      console.error('Error unsnoozing task:', error);
      alert('Failed to unsnooze task');
    }

    setLoadingId(null);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    setLoadingId(taskId);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }

    setLoadingId(null);
    router.refresh();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-sm text-gray-500">{tasks.length} tasks</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${
                task.status === 'complete'
                  ? 'bg-gray-50 border-gray-200'
                  : task.status === 'snoozed'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={loadingId === task.id}
                  className={`mt-0.5 flex-shrink-0 ${
                    task.status === 'complete'
                      ? 'text-green-500'
                      : getPriorityColor(task.priority)
                  }`}
                >
                  {task.status === 'complete' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={`font-medium ${
                      task.status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </p>
                    {task.is_recurring && (
                      <Repeat className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                  )}

                  <div className="flex items-center space-x-3 mt-1.5">
                    {/* Bucket tag */}
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${task.buckets?.color}20`,
                        color: task.buckets?.color
                      }}
                    >
                      {task.buckets?.name}
                    </span>

                    {/* Due date */}
                    {task.due_date && task.status !== 'complete' && (
                      <span className={`flex items-center text-xs ${
                        isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}

                    {/* Snoozed until */}
                    {task.status === 'snoozed' && task.snoozed_until && (
                      <span className="flex items-center text-xs text-yellow-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Until {formatDueDate(task.snoozed_until)}
                      </span>
                    )}

                    {/* Recurrence */}
                    {task.is_recurring && task.recurrence_rule && (
                      <span className="text-xs text-blue-500 capitalize">
                        {task.recurrence_rule}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {task.status === 'snoozed' ? (
                    <button
                      onClick={() => handleUnsnooze(task.id)}
                      disabled={loadingId === task.id}
                      className="p-1.5 text-yellow-500 hover:text-yellow-600"
                      title="Unsnooze"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : task.status !== 'complete' && (
                    <div className="relative">
                      <button
                        onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                        title="Snooze"
                      >
                        <Clock className="w-4 h-4" />
                      </button>

                      {expandedId === task.id && (
                        <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border p-2 z-10 min-w-[120px]">
                          <p className="text-xs text-gray-500 mb-2">Snooze for:</p>
                          {[
                            { label: '1 day', days: 1 },
                            { label: '3 days', days: 3 },
                            { label: '1 week', days: 7 },
                            { label: '2 weeks', days: 14 },
                          ].map((option) => (
                            <button
                              key={option.days}
                              onClick={() => handleSnooze(task.id, option.days)}
                              className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={loadingId === task.id}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
