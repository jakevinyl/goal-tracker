'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/types/database';
import { Plus } from 'lucide-react';

interface TimeEntryFormProps {
  buckets: Bucket[];
  userId: string;
}

export function TimeEntryForm({ buckets, userId }: TimeEntryFormProps) {
  const [selectedBucket, setSelectedBucket] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBucket || !hours) {
      alert('Please select a bucket and enter hours');
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter a valid number of hours');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        bucket_id: selectedBucket,
        entry_date: date,
        hours: hoursNum,
        description: description || null,
        entry_type: 'manual',
      });

    if (error) {
      console.error('Error creating time entry:', error);
      alert('Failed to save time entry');
    } else {
      // Reset form
      setSelectedBucket('');
      setHours('');
      setDescription('');
      router.refresh();
    }

    setIsSubmitting(false);
  };

  // Quick log buttons
  const quickLogOptions = [
    { label: '+30m', value: 0.5 },
    { label: '+1h', value: 1 },
    { label: '+2h', value: 2 },
    { label: '+4h', value: 4 },
  ];

  const handleQuickLog = (hoursValue: number) => {
    // Add to current hours instead of replacing
    const currentHours = parseFloat(hours) || 0;
    setHours((currentHours + hoursValue).toString());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Log Time</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bucket Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bucket
            </label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a bucket...</option>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Add
            </label>
            <div className="flex space-x-2">
              {quickLogOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLog(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Hours Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 2.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            Log Time
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
