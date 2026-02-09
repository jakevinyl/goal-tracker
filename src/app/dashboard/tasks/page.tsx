import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TasksPageClient } from '@/components/tasks/TasksPageClient';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500">Manage your todos and recurring tasks</p>
      </div>

      <TasksPageClient
        tasks={tasks || []}
        buckets={buckets || []}
        goals={goals || []}
        userId={user.id}
      />
    </div>
  );
}
