'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Task, Bucket, TaskUpdate } from '@/lib/types/database';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  RotateCcw,
  Calendar,
  Repeat,
  UserCheck,
  Timer,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Save,
  Edit3,
  Pencil,
  Sparkles,
  ListPlus,
  Loader2
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
  const [completingTask, setCompletingTask] = useState<(Task & { buckets: Bucket }) | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [detailsExpandedId, setDetailsExpandedId] = useState<string | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<Record<string, TaskUpdate[]>>({});
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [progressNotesDraft, setProgressNotesDraft] = useState('');
  const [newUpdateText, setNewUpdateText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    expected_hours: string;
    description: string;
  }>({ title: '', priority: 'medium', due_date: '', expected_hours: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  // Create task from update
  const [creatingTaskFrom, setCreatingTaskFrom] = useState<{ text: string; taskId: string; bucketId: string } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  // AI extraction
  const [extractingFrom, setExtractingFrom] = useState<{ text: string; taskId: string; bucketId: string } | null>(null);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<Set<number>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [creatingExtracted, setCreatingExtracted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Calculate next due date for recurring tasks
  const getNextDueDate = (currentDueDate: string | null, recurrenceRule: string): string => {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const nextDate = new Date(baseDate);

    switch (recurrenceRule) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }

    return nextDate.toISOString().split('T')[0];
  };

  const handleCompleteClick = (task: Task & { buckets: Bucket }) => {
    if (task.status === 'complete') {
      // Reopen task directly
      handleReopenTask(task);
    } else {
      // Show completion dialog
      setCompletingTask(task);
      setCompletionNote('');
    }
  };

  const handleReopenTask = async (task: Task & { buckets: Bucket }) => {
    setLoadingId(task.id);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'open', completed_at: null, completion_note: null })
      .eq('id', task.id);

    if (error) {
      console.error('Error reopening task:', error);
      alert('Failed to reopen task');
    }

    setLoadingId(null);
    router.refresh();
  };

  const handleConfirmComplete = async () => {
    if (!completingTask) return;

    setLoadingId(completingTask.id);

    // Complete the task
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        completion_note: completionNote.trim() || null,
        snoozed_until: null
      })
      .eq('id', completingTask.id);

    if (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
      setLoadingId(null);
      return;
    }

    // If recurring, create the next occurrence
    if (completingTask.is_recurring && completingTask.recurrence_rule) {
      const nextDueDate = getNextDueDate(completingTask.due_date, completingTask.recurrence_rule);

      const { error: createError } = await supabase
        .from('tasks')
        .insert({
          user_id: completingTask.user_id,
          bucket_id: completingTask.bucket_id,
          goal_id: completingTask.goal_id,
          title: completingTask.title,
          description: completingTask.description,
          priority: completingTask.priority,
          due_date: nextDueDate,
          expected_hours: completingTask.expected_hours,
          is_recurring: true,
          recurrence_rule: completingTask.recurrence_rule,
          is_delegated: completingTask.is_delegated,
          delegated_to: completingTask.delegated_to,
          status: 'open',
        });

      if (createError) {
        console.error('Error creating next recurring task:', createError);
        // Don't alert - the main task was completed successfully
      }
    }

    setLoadingId(null);
    setCompletingTask(null);
    setCompletionNote('');
    router.refresh();
  };

  const handleCancelComplete = () => {
    setCompletingTask(null);
    setCompletionNote('');
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

  // Start editing a task
  const handleStartEdit = (task: Task & { buckets: Bucket }) => {
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      priority: task.priority,
      due_date: task.due_date || '',
      expected_hours: task.expected_hours?.toString() || '',
      description: task.description || '',
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditDraft({ title: '', priority: 'medium', due_date: '', expected_hours: '', description: '' });
  };

  // Save task edits
  const handleSaveEdit = async (taskId: string) => {
    if (!editDraft.title.trim()) {
      alert('Title is required');
      return;
    }

    setSavingEdit(true);

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editDraft.title.trim(),
        priority: editDraft.priority,
        due_date: editDraft.due_date || null,
        expected_hours: editDraft.expected_hours ? parseFloat(editDraft.expected_hours) : null,
        description: editDraft.description.trim() || null,
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } else {
      setEditingTaskId(null);
      router.refresh();
    }

    setSavingEdit(false);
  };

  // Fetch task updates when expanding details
  const handleExpandDetails = async (task: Task & { buckets: Bucket }) => {
    if (detailsExpandedId === task.id) {
      setDetailsExpandedId(null);
      setEditingProgressId(null);
      return;
    }

    setDetailsExpandedId(task.id);
    setProgressNotesDraft(task.progress_notes || '');
    setNewUpdateText('');

    // Fetch activity log for this task
    const { data, error } = await supabase
      .from('task_updates')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTaskUpdates(prev => ({ ...prev, [task.id]: data }));
    }
  };

  // Save progress notes
  const handleSaveProgressNotes = async (taskId: string) => {
    setSavingNotes(true);

    const { error } = await supabase
      .from('tasks')
      .update({ progress_notes: progressNotesDraft.trim() || null })
      .eq('id', taskId);

    if (error) {
      console.error('Error saving progress notes:', error);
      alert('Failed to save notes');
    } else {
      setEditingProgressId(null);
      router.refresh();
    }

    setSavingNotes(false);
  };

  // Add activity log entry
  const handleAddUpdate = async (task: Task & { buckets: Bucket }) => {
    if (!newUpdateText.trim()) return;

    setAddingUpdate(true);

    const { data, error } = await supabase
      .from('task_updates')
      .insert({
        task_id: task.id,
        user_id: task.user_id,
        content: newUpdateText.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding update:', error);
      alert('Failed to add update');
    } else if (data) {
      setTaskUpdates(prev => ({
        ...prev,
        [task.id]: [data, ...(prev[task.id] || [])]
      }));
      setNewUpdateText('');
    }

    setAddingUpdate(false);
  };

  // Create a single task from update text
  const handleCreateTaskFromUpdate = async () => {
    if (!creatingTaskFrom || !newTaskTitle.trim()) return;

    setCreatingTask(true);

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: tasks[0]?.user_id,
        bucket_id: creatingTaskFrom.bucketId,
        title: newTaskTitle.trim(),
        status: 'open',
        priority: 'medium',
      });

    if (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } else {
      setCreatingTaskFrom(null);
      setNewTaskTitle('');
      router.refresh();
    }

    setCreatingTask(false);
  };

  // Extract tasks using AI
  const handleExtractTasks = async () => {
    if (!extractingFrom) return;

    setIsExtracting(true);
    setExtractedTasks([]);
    setSelectedExtracted(new Set());

    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractingFrom.text }),
      });

      if (!response.ok) throw new Error('Failed to extract tasks');

      const data = await response.json();
      setExtractedTasks(data.tasks || []);
      // Select all by default
      setSelectedExtracted(new Set(data.tasks?.map((_: string, i: number) => i) || []));
    } catch (error) {
      console.error('Error extracting tasks:', error);
      alert('Failed to extract tasks. Make sure the API is configured.');
    }

    setIsExtracting(false);
  };

  // Create selected extracted tasks
  const handleCreateExtractedTasks = async () => {
    if (!extractingFrom || selectedExtracted.size === 0) return;

    setCreatingExtracted(true);

    const tasksToCreate = extractedTasks
      .filter((_, i) => selectedExtracted.has(i))
      .map(title => ({
        user_id: tasks[0]?.user_id,
        bucket_id: extractingFrom.bucketId,
        title: title.trim(),
        status: 'open',
        priority: 'medium',
      }));

    const { error } = await supabase
      .from('tasks')
      .insert(tasksToCreate);

    if (error) {
      console.error('Error creating tasks:', error);
      alert('Failed to create tasks');
    } else {
      setExtractingFrom(null);
      setExtractedTasks([]);
      setSelectedExtracted(new Set());
      router.refresh();
    }

    setCreatingExtracted(false);
  };

  const formatUpdateDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <>
      {/* Completion Dialog */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Complete Task</h3>
              <button
                onClick={handleCancelComplete}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              <span className="font-medium">{completingTask.title}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion note (optional)
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="What did you accomplish? Any notes for next time?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {completingTask.is_recurring && (
              <p className="text-sm text-blue-600 mb-4">
                <Repeat className="w-4 h-4 inline mr-1" />
                A new {completingTask.recurrence_rule} task will be created automatically.
              </p>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleConfirmComplete}
                isLoading={loadingId === completingTask.id}
                className="flex-1"
              >
                Complete
              </Button>
              <Button variant="outline" onClick={handleCancelComplete}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task from Update Dialog */}
      {creatingTaskFrom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ListPlus className="w-5 h-5 mr-2 text-blue-600" />
                Create Task
              </h3>
              <button
                onClick={() => { setCreatingTaskFrom(null); setNewTaskTitle(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">From update:</p>
              <p className="italic">&quot;{creatingTaskFrom.text}&quot;</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskTitle.trim()) {
                    handleCreateTaskFromUpdate();
                  }
                }}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleCreateTaskFromUpdate}
                isLoading={creatingTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1"
              >
                Create Task
              </Button>
              <Button variant="outline" onClick={() => { setCreatingTaskFrom(null); setNewTaskTitle(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Extract Tasks Dialog */}
      {extractingFrom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Extract Tasks with AI
              </h3>
              <button
                onClick={() => { setExtractingFrom(null); setExtractedTasks([]); setSelectedExtracted(new Set()); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Analyzing:</p>
              <p className="italic">&quot;{extractingFrom.text}&quot;</p>
            </div>

            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                <p className="text-gray-500">Extracting tasks...</p>
              </div>
            ) : extractedTasks.length > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Found {extractedTasks.length} potential task(s):
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {extractedTasks.map((task, i) => (
                    <label
                      key={i}
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedExtracted.has(i)
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExtracted.has(i)}
                        onChange={(e) => {
                          const newSet = new Set(selectedExtracted);
                          if (e.target.checked) {
                            newSet.add(i);
                          } else {
                            newSet.delete(i);
                          }
                          setSelectedExtracted(newSet);
                        }}
                        className="mt-0.5 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{task}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-gray-500 text-center py-4">
                  Click &quot;Extract&quot; to find tasks in this update.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              {extractedTasks.length > 0 ? (
                <Button
                  onClick={handleCreateExtractedTasks}
                  isLoading={creatingExtracted}
                  disabled={selectedExtracted.size === 0}
                  className="flex-1"
                >
                  Create {selectedExtracted.size} Task{selectedExtracted.size !== 1 ? 's' : ''}
                </Button>
              ) : (
                <Button
                  onClick={handleExtractTasks}
                  isLoading={isExtracting}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Tasks
                </Button>
              )}
              <Button variant="outline" onClick={() => { setExtractingFrom(null); setExtractedTasks([]); setSelectedExtracted(new Set()); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => handleCompleteClick(task)}
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
                    {/* Edit Mode */}
                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        {/* Title */}
                        <input
                          type="text"
                          value={editDraft.title}
                          onChange={(e) => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Task title"
                          autoFocus
                        />

                        {/* Description */}
                        <input
                          type="text"
                          value={editDraft.description}
                          onChange={(e) => setEditDraft(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Description (optional)"
                        />

                        {/* Row of fields */}
                        <div className="flex flex-wrap gap-2">
                          {/* Priority */}
                          <select
                            value={editDraft.priority}
                            onChange={(e) => setEditDraft(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>

                          {/* Due Date */}
                          <input
                            type="date"
                            value={editDraft.due_date}
                            onChange={(e) => setEditDraft(prev => ({ ...prev, due_date: e.target.value }))}
                            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />

                          {/* Expected Hours */}
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              value={editDraft.expected_hours}
                              onChange={(e) => setEditDraft(prev => ({ ...prev, expected_hours: e.target.value }))}
                              className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Est."
                            />
                            <span className="text-xs text-gray-500">hrs</span>
                          </div>
                        </div>

                        {/* Save/Cancel buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(task.id)}
                            disabled={savingEdit}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Normal View */}
                        <div className="flex items-center space-x-2 flex-wrap">
                          <p className={`font-medium ${
                            task.status === 'complete' ? 'text-gray-400 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          {task.is_recurring && (
                            <Repeat className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          {task.is_delegated && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {task.delegated_to || 'Delegated'}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                        )}

                        {/* Completion note for completed tasks */}
                        {task.status === 'complete' && task.completion_note && (
                          <div className="flex items-start space-x-1 mt-1 text-sm text-green-700 bg-green-50 rounded px-2 py-1">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>{task.completion_note}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-3 mt-1.5 flex-wrap gap-y-1">
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

                          {/* Expected time */}
                          {task.expected_hours && (
                            <span className="flex items-center text-xs text-gray-500">
                              <Timer className="w-3 h-3 mr-1" />
                              {task.expected_hours}h
                            </span>
                          )}

                          {/* Progress indicator */}
                          {(task.progress_notes || (taskUpdates[task.id]?.length > 0)) && (
                            <span className="flex items-center text-xs text-blue-500">
                              <FileText className="w-3 h-3 mr-1" />
                              Has notes
                            </span>
                          )}
                        </div>

                        {/* Expand/Collapse Details Button */}
                        {task.status !== 'complete' && (
                          <button
                            onClick={() => handleExpandDetails(task)}
                            className="mt-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
                          >
                            {detailsExpandedId === task.id ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                                Hide progress
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                                Log progress
                              </>
                            )}
                          </button>
                        )}

                        {/* Expanded Progress Section */}
                        {detailsExpandedId === task.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                            {/* Progress Notes */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-gray-600">
                                  Current Status / Notes
                                </label>
                                {editingProgressId !== task.id ? (
                                  <button
                                    onClick={() => {
                                      setEditingProgressId(task.id);
                                      setProgressNotesDraft(task.progress_notes || '');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Edit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSaveProgressNotes(task.id)}
                                    disabled={savingNotes}
                                    className="text-xs text-green-600 hover:text-green-700 flex items-center"
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    {savingNotes ? 'Saving...' : 'Save'}
                                  </button>
                                )}
                              </div>
                              {editingProgressId === task.id ? (
                                <textarea
                                  value={progressNotesDraft}
                                  onChange={(e) => setProgressNotesDraft(e.target.value)}
                                  placeholder="What's the current status? Any blockers or notes?"
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <div className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1.5 min-h-[2rem]">
                                  {task.progress_notes || <span className="text-gray-400 italic">No notes yet</span>}
                                </div>
                              )}
                            </div>

                            {/* Activity Log */}
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1">
                                Activity Log
                              </label>

                              {/* Add new update */}
                              <div className="flex space-x-2 mb-2">
                                <input
                                  type="text"
                                  value={newUpdateText}
                                  onChange={(e) => setNewUpdateText(e.target.value)}
                                  placeholder="Add a progress update..."
                                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddUpdate(task);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddUpdate(task)}
                                  disabled={!newUpdateText.trim() || addingUpdate}
                                  className="px-2 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Update list */}
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {(taskUpdates[task.id] || []).length === 0 ? (
                                  <p className="text-xs text-gray-400 italic py-1">No updates yet</p>
                                ) : (
                                  (taskUpdates[task.id] || []).map((update) => (
                                    <div key={update.id} className="group flex items-start space-x-2 text-sm bg-blue-50 rounded px-2 py-1.5 hover:bg-blue-100 transition-colors">
                                      <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                        {formatUpdateDate(update.created_at)}
                                      </span>
                                      <span className="text-gray-700 flex-1">{update.content}</span>
                                      {/* Action buttons - show on hover */}
                                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => {
                                            setCreatingTaskFrom({ text: update.content, taskId: task.id, bucketId: task.bucket_id });
                                            setNewTaskTitle(update.content);
                                          }}
                                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-white"
                                          title="Create task from this"
                                        >
                                          <ListPlus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setExtractingFrom({ text: update.content, taskId: task.id, bucketId: task.bucket_id });
                                          }}
                                          className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-white"
                                          title="Extract tasks with AI"
                                        >
                                          <Sparkles className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {/* Edit button - only show when not already editing */}
                    {task.status !== 'complete' && editingTaskId !== task.id && (
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-blue-500"
                        title="Edit task"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {task.status === 'snoozed' ? (
                      <button
                        onClick={() => handleUnsnooze(task.id)}
                        disabled={loadingId === task.id}
                        className="p-1.5 text-yellow-500 hover:text-yellow-600"
                        title="Unsnooze"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : task.status !== 'complete' && editingTaskId !== task.id && (
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
    </>
  );
}
