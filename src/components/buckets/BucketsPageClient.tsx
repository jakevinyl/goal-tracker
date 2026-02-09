'use client';

import { useState } from 'react';
import { BucketList } from './BucketList';
import { BucketForm } from './BucketForm';
import type { Bucket } from '@/lib/types/database';

interface BucketsPageClientProps {
  buckets: Bucket[];
  userId: string;
}

export function BucketsPageClient({ buckets, userId }: BucketsPageClientProps) {
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);

  const handleEdit = (bucket: Bucket) => {
    setEditingBucket(bucket);
  };

  const handleCloseEdit = () => {
    setEditingBucket(null);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <BucketForm
        buckets={buckets}
        userId={userId}
        editingBucket={editingBucket}
        onClose={handleCloseEdit}
      />

      {/* List */}
      <BucketList
        buckets={buckets}
        onEdit={handleEdit}
      />
    </div>
  );
}
