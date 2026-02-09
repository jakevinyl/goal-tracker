import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/dates';
import { CheckInForm } from '@/components/check-in/CheckInForm';
import { CheckInHistory } from '@/components/check-in/CheckInHistory';
import { StreakDisplay } from '@/components/check-in/StreakDisplay';

export default async function DailyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch data in parallel
  const [questionsResult, responsesResult] = await Promise.all([
    // Get active survey questions
    supabase
      .from('survey_questions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order'),

    // Get check-in responses (last 30 days)
    supabase
      .from('check_in_responses')
      .select('*, survey_questions(*)')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(30),
  ]);

  const questions = questionsResult.data || [];
  const responses = responsesResult.data || [];

  // Check if today's check-in exists
  const todayResponse = responses.find((r) => r.check_in_date === today);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Check-In</h1>
        <p className="text-gray-500">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Streak Display */}
      <StreakDisplay responses={responses} />

      {/* Check-In Form or Today's Summary */}
      <CheckInForm
        questions={questions}
        todayResponse={todayResponse}
        userId={user.id}
      />

      {/* History */}
      <CheckInHistory responses={responses} />
    </div>
  );
}
