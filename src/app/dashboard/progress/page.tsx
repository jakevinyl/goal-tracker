import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProgressLogForm } from '@/components/progress/ProgressLogForm';
import { ProgressTimeline } from '@/components/progress/ProgressTimeline';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch buckets
  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('sort_order');

  // Fetch goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('title');

  // Fetch progress logs with bucket and goal relations
  const { data: progressLogs } = await supabase
    .from('progress_log_entries')
    .select(`
      *,
      bucket:buckets(*),
      goal:goals(*)
    `)
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch check-ins with questions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: checkIns } = await supabase
    .from('check_in_responses')
    .select(`
      *,
      question:survey_questions(*)
    `)
    .eq('user_id', user.id)
    .gte('check_in_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('check_in_date', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Log</h1>
        <p className="text-gray-500">Journal your wins, learnings, and reflections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <ProgressLogForm
            buckets={buckets || []}
            goals={goals || []}
            userId={user.id}
          />
        </div>

        {/* Timeline - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ProgressTimeline
            progressLogs={progressLogs || []}
            checkIns={checkIns || []}
            buckets={buckets || []}
          />
        </div>
      </div>
    </div>
  );
}
