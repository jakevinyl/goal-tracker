import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default async function BucketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: buckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('parent_bucket_id', null)
    .order('sort_order');

  const { data: childBuckets } = await supabase
    .from('buckets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .not('parent_bucket_id', 'is', null)
    .order('sort_order');

  // Group children by parent
  const childrenByParent = new Map<string, typeof childBuckets>();
  childBuckets?.forEach((child) => {
    const existing = childrenByParent.get(child.parent_bucket_id!) || [];
    childrenByParent.set(child.parent_bucket_id!, [...existing, child]);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Life Areas</h1>
        <p className="text-gray-500">Your buckets for tracking time and goals</p>
      </div>

      {buckets?.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No Buckets Yet</h3>
                <p className="text-gray-500 mt-1">
                  Run the seed script in Supabase to create your default buckets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets?.map((bucket) => {
            const children = childrenByParent.get(bucket.id) || [];

            return (
              <Card key={bucket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${bucket.color}20` }}
                    >
                      <FolderOpen
                        className="w-6 h-6"
                        style={{ color: bucket.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {bucket.name}
                      </h3>
                      {bucket.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {bucket.description}
                        </p>
                      )}
                      {children.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center space-x-2 text-sm text-gray-600"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: child.color }}
                              />
                              <span>{child.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
