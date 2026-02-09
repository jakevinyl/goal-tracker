import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/dates';
import { TimeEntryForm } from '@/components/time-tracking/TimeEntryForm';
import { Timer } from '@/components/time-tracking/Timer';
import { TimeEntryList } from '@/components/time-tracking/TimeEntryList';
import { AllocationChart } from '@/components/time-tracking/AllocationChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function TimePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart();

  // Fetch data in parallel
  const [bucketsResult, entriesResult, targetsResult, settingsResult] = await Promise.all([
    // Get all buckets
    supabase
      .from('buckets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),

    // Get time entries for this week
    supabase
      .from('time_entries')
      .select('*, buckets(*)')
      .eq('user_id', user.id)
      .gte('entry_date', weekStart)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false }),

    // Get time targets
    supabase
      .from('time_targets')
      .select('*, buckets(*)')
      .eq('user_id', user.id),

    // Get user settings
    supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ]);

  const buckets = bucketsResult.data || [];
  const entries = entriesResult.data || [];
  const targets = targetsResult.data || [];
  const settings = settingsResult.data || { awake_hours_per_day: 16 };

  // Filter entries by today
  const todayEntries = entries.filter((e) => e.entry_date === today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-gray-500">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Entry Forms */}
        <div className="space-y-6">
          {/* Timer */}
          <Timer buckets={buckets} userId={user.id} />

          {/* Manual Entry Form */}
          <TimeEntryForm buckets={buckets} userId={user.id} />
        </div>

        {/* Right Column - Visualization */}
        <div className="space-y-6">
          {/* Allocation Chart */}
          <AllocationChart
            entries={entries}
            targets={targets}
            buckets={buckets}
            awakeHoursPerDay={settings.awake_hours_per_day}
          />
        </div>
      </div>

      {/* Today's Entries */}
      <TimeEntryList
        entries={todayEntries}
        title="Today's Time Log"
        showDate={false}
      />

      {/* This Week's Entries */}
      <TimeEntryList
        entries={entries.filter((e) => e.entry_date !== today)}
        title="This Week"
        showDate={true}
      />
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
