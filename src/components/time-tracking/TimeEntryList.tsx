'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { TimeEntry, Bucket } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/dates';
import { Clock, Trash2, Pencil, X, Check } from 'lucide-react';

interface TimeEntryListProps {
  entries: (TimeEntry & { buckets: Bucket })[];
  title: string;
  showDate?: boolean;
}

export function TimeEntryList({ entries, title, showDate = false }: TimeEntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  const handleEdit = (entry: TimeEntry & { buckets: Bucket }) => {
    setEditingId(entry.id);
    setEditHours(entry.hours.toString());
    setEditDescription(entry.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHours('');
    setEditDescription('');
  };

  const handleSaveEdit = async (id: string) => {
    const hoursNum = parseFloat(editHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter valid hours');
      return;
    }

    const { error } = await supabase
      .from('time_entries')
      .update({
        hours: hoursNum,
        description: editDescription || null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    } else {
      setEditingId(null);
      router.refresh();
    }
  };

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
              className="p-3 bg-gray-50 rounded-lg"
            >
              {editingId === entry.id ? (
                // Edit mode
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.buckets?.color || '#gray' }}
                    />
                    <span className="font-medium text-gray-900">{entry.buckets?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Hours"
                    />
                    <span className="text-gray-500">h</span>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Description (optional)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(entry.id)}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
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
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {entry.hours}h
                    </span>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 text-gray-400 hover:text-blue-500"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
