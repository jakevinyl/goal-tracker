import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BucketsPageClient } from '@/components/buckets/BucketsPageClient';

export default async function BucketsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch all buckets (including inactive for management)
  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Life Areas</h1>
        <p className="text-gray-500">Manage your buckets for tracking time and goals</p>
      </div>

      <BucketsPageClient
        buckets={buckets || []}
        userId={user.id}
      />
    </div>
  );
}
