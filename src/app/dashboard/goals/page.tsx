import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GoalsPageClient } from '@/components/goals/GoalsPageClient';

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch goals with bucket and measure relations
  const { data: goals } = await supabase
    .from('goals')
    .select(`
      *,
      bucket:buckets(*),
      measure:survey_questions(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch buckets
  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('sort_order');

  // Fetch survey questions (for measure linking)
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('sort_order');

  return (
    <GoalsPageClient
      goals={goals || []}
      buckets={buckets || []}
      questions={questions || []}
      userId={user.id}
    />
  );
}
