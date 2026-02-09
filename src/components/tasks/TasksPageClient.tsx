'use client';

import { useState, useMemo } from 'react';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import type { Task, Bucket, Goal } from '@/lib/types/database';
import { ArrowUpDown, Filter } from 'lucide-react';

type SortOption = 'priority' | 'due_date' | 'expected_hours' | 'bucket' | 'created';
type FilterOption = 'all' | 'delegated' | 'mine';

interface TasksPageClientProps {
  tasks: (Task & { buckets: Bucket })[];
  buckets: Bucket[];
  goals: Goal[];
  userId: string;
}

export function TasksPageClient({ tasks, buckets, goals, userId }: TasksPageClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const today = new Date().toISOString().split('T')[0];

  // Filter tasks by status first
  const openTasks = tasks.filter(t =>
    t.status === 'open' ||
    (t.status === 'snoozed' && t.snoozed_until && t.snoozed_until <= today)
  );

  const snoozedTasks = tasks.filter(t =>
    t.status === 'snoozed' && t.snoozed_until && t.snoozed_until > today
  );

  const completedTasks = tasks.filter(t => t.status === 'complete');

  // Apply filter
  const filteredOpenTasks = useMemo(() => {
    switch (filterBy) {
      case 'delegated':
        return openTasks.filter(t => t.is_delegated);
      case 'mine':
        return openTasks.filter(t => !t.is_delegated);
      default:
        return openTasks;
    }
  }, [openTasks, filterBy]);

  // Apply sort
  const sortedOpenTasks = useMemo(() => {
    const priorityWeight: Record<string, number> = { high: 0, medium: 1, low: 2 };

    return [...filteredOpenTasks].sort((a, b) => {
      // Always put overdue tasks first
      const aOverdue = a.due_date && a.due_date < today;
      const bOverdue = b.due_date && b.due_date < today;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      switch (sortBy) {
        case 'priority':
          const aPriority = priorityWeight[a.priority] ?? 1;
          const bPriority = priorityWeight[b.priority] ?? 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          // Secondary sort by due date
          if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;

        case 'due_date':
          if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;

        case 'expected_hours':
          const aHours = a.expected_hours ?? Infinity;
          const bHours = b.expected_hours ?? Infinity;
          return aHours - bHours;

        case 'bucket':
          const aName = a.buckets?.name || '';
          const bName = b.buckets?.name || '';
          return aName.localeCompare(bName);

        case 'created':
          return b.created_at.localeCompare(a.created_at);

        default:
          return 0;
      }
    });
  }, [filteredOpenTasks, sortBy, today]);

  const delegatedCount = openTasks.filter(t => t.is_delegated).length;
  const myTasksCount = openTasks.filter(t => !t.is_delegated).length;

  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <TaskForm
        buckets={buckets}
        goals={goals}
        userId={userId}
      />

      {/* Sort & Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="expected_hours">Sort by Est. Time</option>
            <option value="bucket">Sort by Bucket</option>
            <option value="created">Sort by Newest</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tasks ({openTasks.length})</option>
            <option value="mine">My Tasks ({myTasksCount})</option>
            <option value="delegated">Delegated ({delegatedCount})</option>
          </select>
        </div>
      </div>

      {/* Open Tasks */}
      <TaskList
        tasks={sortedOpenTasks}
        title={filterBy === 'delegated' ? 'Delegated Tasks' : filterBy === 'mine' ? 'My Tasks' : 'To Do'}
        emptyMessage={
          filterBy === 'delegated'
            ? 'No delegated tasks'
            : filterBy === 'mine'
            ? 'No personal tasks'
            : 'No open tasks. Add one above!'
        }
      />

      {/* Snoozed Tasks */}
      {snoozedTasks.length > 0 && (
        <TaskList
          tasks={snoozedTasks}
          title="Snoozed"
          emptyMessage="No snoozed tasks"
        />
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <TaskList
          tasks={completedTasks.slice(0, 10)}
          title="Recently Completed"
          showCompleted
          emptyMessage="No completed tasks"
        />
      )}
    </div>
  );
}
