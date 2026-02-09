'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { TimeEntry, Bucket } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/dates';
import { Clock, Trash2 } from 'lucide-react';

interface TimeEntryListProps {
  entries: (TimeEntry & { buckets: Bucket })[];
  title: string;
  showDate?: boolean;
}

export function TimeEntryList({ entries, title, showDate = false }: TimeEntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;

    setDeletingId(id);

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    } else {
      router.refresh();
    }

    setDeletingId(null);
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No time entries yet</p>
        </CardContent>
      </Card>
    );
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center space-x-1 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{totalHours.toFixed(1)}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.buckets?.color || '#gray' }}
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {entry.buckets?.name}
                  </p>
                  {entry.description && (
                    <p className="text-sm text-gray-500">{entry.description}</p>
                  )}
                  {showDate && (
                    <p className="text-xs text-gray-400">
                      {formatDate(entry.entry_date, 'EEE, MMM d')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-900">
                  {entry.hours}h
                </span>
                <span className="text-xs text-gray-400 uppercase">
                  {entry.entry_type}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
