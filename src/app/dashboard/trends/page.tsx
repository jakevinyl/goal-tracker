import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrendsPageClient } from '@/components/trends/TrendsPageClient';

export default async function TrendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get date range (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  // Fetch all data in parallel
  const [
    goalsResult,
    checkInLogsResult,
    checkInResponsesResult,
    questionsResult,
    timeEntriesResult,
    bucketsResult,
    timeTargetsResult
  ] = await Promise.all([
    // Goals with linked measures
    supabase
      .from('goals')
      .select('*, survey_questions(*)')
      .eq('user_id', user.id)
      .in('status', ['not_started', 'in_progress'])
      .not('measure_id', 'is', null),

    // Goal check-in logs for the last 30 days
    supabase
      .from('goal_check_in_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', startDate)
      .order('log_date', { ascending: true }),

    // Check-in responses for the last 30 days
    supabase
      .from('check_in_responses')
      .select('*, survey_questions(*)')
      .eq('user_id', user.id)
      .gte('check_in_date', startDate)
      .order('check_in_date', { ascending: true }),

    // All active survey questions
    supabase
      .from('survey_questions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),

    // Time entries for the last 30 days
    supabase
      .from('time_entries')
      .select('*, buckets(*)')
      .eq('user_id', user.id)
      .gte('entry_date', startDate)
      .order('entry_date', { ascending: true }),

    // Buckets
    supabase
      .from('buckets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true),

    // Time targets
    supabase
      .from('time_targets')
      .select('*')
      .eq('user_id', user.id),
  ]);

  return (
    <TrendsPageClient
      goals={goalsResult.data || []}
      goalCheckInLogs={checkInLogsResult.data || []}
      checkInResponses={checkInResponsesResult.data || []}
      questions={questionsResult.data || []}
      timeEntries={timeEntriesResult.data || []}
      buckets={bucketsResult.data || []}
      timeTargets={timeTargetsResult.data || []}
    />
  );
}
