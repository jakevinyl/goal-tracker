import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch all tasks with bucket info
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, buckets(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch buckets for the form
  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('sort_order');

  // Fetch goals for linking
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('target_date');

  const allTasks = tasks || [];
  const today = new Date().toISOString().split('T')[0];

  // Filter tasks by status
  const openTasks = allTasks.filter(t =>
    t.status === 'open' ||
    (t.status === 'snoozed' && t.snoozed_until && t.snoozed_until <= today)
  );

  const snoozedTasks = allTasks.filter(t =>
    t.status === 'snoozed' && t.snoozed_until && t.snoozed_until > today
  );

  const completedTasks = allTasks.filter(t => t.status === 'complete');

  // Sort open tasks: overdue first, then by priority, then by due date
  const sortedOpenTasks = [...openTasks].sort((a, b) => {
    // Priority weight
    const priorityWeight = { high: 0, medium: 1, low: 2 };

    // Overdue tasks first
    const aOverdue = a.due_date && a.due_date < today;
    const bOverdue = b.due_date && b.due_date < today;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by priority
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }

    // Then by due date
    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500">Manage your todos and recurring tasks</p>
      </div>

      {/* Add Task Form */}
      <TaskForm
        buckets={buckets || []}
        goals={goals || []}
        userId={user.id}
      />

      {/* Open Tasks */}
      <TaskList
        tasks={sortedOpenTasks}
        title="To Do"
        emptyMessage="No open tasks. Add one above!"
      />

      {/* Snoozed Tasks */}
      {snoozedTasks.length > 0 && (
        <TaskList
          tasks={snoozedTasks}
          title="Snoozed"
          emptyMessage="No snoozed tasks"
        />
      )}

      {/* Completed Tasks (last 7 days) */}
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
