'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/types/database';
import { Pencil, Trash2, GripVertical, ChevronRight } from 'lucide-react';

interface BucketListProps {
  buckets: Bucket[];
  onEdit: (bucket: Bucket) => void;
}

export function BucketList({ buckets, onEdit }: BucketListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Group buckets by parent
  const topLevelBuckets = buckets.filter(b => !b.parent_bucket_id);
  const childBuckets = buckets.filter(b => b.parent_bucket_id);

  const getChildren = (parentId: string) => {
    return childBuckets.filter(b => b.parent_bucket_id === parentId);
  };

  const handleDelete = async (bucket: Bucket) => {
    const children = getChildren(bucket.id);
    if (children.length > 0) {
      alert('Cannot delete a bucket that has sub-buckets. Delete the sub-buckets first.');
      return;
    }

    if (!confirm(`Delete "${bucket.name}"? This cannot be undone.`)) return;

    setDeletingId(bucket.id);

    const { error } = await supabase
      .from('buckets')
      .delete()
      .eq('id', bucket.id);

    if (error) {
      console.error('Error deleting bucket:', error);
      if (error.message.includes('foreign key')) {
        alert('Cannot delete this bucket because it has time entries, tasks, or goals associated with it.');
      } else {
        alert('Failed to delete bucket');
      }
    } else {
      router.refresh();
    }

    setDeletingId(null);
  };

  const handleToggleActive = async (bucket: Bucket) => {
    const { error } = await supabase
      .from('buckets')
      .update({ is_active: !bucket.is_active })
      .eq('id', bucket.id);

    if (error) {
      console.error('Error updating bucket:', error);
      alert('Failed to update bucket');
    } else {
      router.refresh();
    }
  };

  const renderBucket = (bucket: Bucket, isChild = false) => {
    const children = getChildren(bucket.id);

    return (
      <div key={bucket.id}>
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${
            bucket.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
          } ${isChild ? 'ml-6' : ''}`}
        >
          <div className="flex items-center space-x-3">
            {/* Color indicator */}
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: bucket.color }}
            />

            {/* Name and description */}
            <div>
              <div className="flex items-center space-x-2">
                <p className={`font-medium ${bucket.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                  {bucket.name}
                </p>
                {!bucket.is_active && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                    Hidden
                  </span>
                )}
                {children.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {children.length} sub-bucket{children.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {bucket.description && (
                <p className="text-sm text-gray-500">{bucket.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleToggleActive(bucket)}
              className={`px-2 py-1 text-xs rounded ${
                bucket.is_active
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-blue-500 hover:bg-blue-50'
              }`}
            >
              {bucket.is_active ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => onEdit(bucket)}
              className="p-1.5 text-gray-400 hover:text-blue-500"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(bucket)}
              disabled={deletingId === bucket.id}
              className="p-1.5 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render children */}
        {children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children.map(child => renderBucket(child, true))}
          </div>
        )}
      </div>
    );
  };

  if (buckets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Life Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No buckets yet. Create one above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Life Areas</CardTitle>
          <span className="text-sm text-gray-500">{buckets.length} buckets</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topLevelBuckets.map(bucket => renderBucket(bucket))}
        </div>
      </CardContent>
    </Card>
  );
}
