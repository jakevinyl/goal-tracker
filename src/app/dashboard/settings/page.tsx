import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsPageClient } from '@/components/settings/SettingsPageClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch measures (survey questions)
  const { data: measures } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order');

  // Fetch goals (to show which ones are linked to measures)
  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, measure_id, status')
    .eq('user_id', user.id)
    .not('measure_id', 'is', null);

  return (
    <SettingsPageClient
      measures={measures || []}
      goals={goals || []}
      userId={user.id}
    />
  );
}
