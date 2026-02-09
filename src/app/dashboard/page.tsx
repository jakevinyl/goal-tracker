import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckInCard } from '@/components/dashboard/CheckInCard';
import { TimeOverview } from '@/components/dashboard/TimeOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingGoals } from '@/components/dashboard/UpcomingGoals';
import { formatDate } from '@/lib/utils/dates';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch today's check-in data
  const today = new Date().toISOString().split('T')[0];

  const [checkInResult, timeResult, goalsResult, bucketsResult] = await Promise.all([
    // Get check-in responses
    supabase
      .from('check_in_responses')
      .select('*, survey_questions(*)')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(30),

    // Get time entries for this week
    supabase
      .from('time_entries')
      .select('*, buckets(*)')
      .eq('user_id', user.id)
      .gte('entry_date', getWeekStart())
      .lte('entry_date', today),

    // Get upcoming goals
    supabase
      .from('goals')
      .select('*, buckets(*)')
      .eq('user_id', user.id)
      .neq('status', 'complete')
      .order('target_date', { ascending: true })
      .limit(5),

    // Get all buckets for reference
    supabase
      .from('buckets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const checkIns = checkInResult.data || [];
  const timeEntries = timeResult.data || [];
  const goals = goalsResult.data || [];
  const buckets = bucketsResult.data || [];

  // Check if user has completed check-in today
  const todayCheckIn = checkIns.find((c) => c.check_in_date === today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Quick Actions */}
      <QuickActions hasCheckedInToday={!!todayCheckIn} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-In Card */}
        <CheckInCard
          checkIns={checkIns}
          todayCheckIn={todayCheckIn}
        />

        {/* Time Overview */}
        <TimeOverview
          timeEntries={timeEntries}
          buckets={buckets}
        />
      </div>

      {/* Upcoming Goals */}
      <UpcomingGoals goals={goals} />
    </div>
  );
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}
