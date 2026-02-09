'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/types/database';
import { Plus, Split, X } from 'lucide-react';

interface TimeEntryFormProps {
  buckets: Bucket[];
  userId: string;
}

interface BucketSplit {
  bucketId: string;
  percent: number;
}

export function TimeEntryForm({ buckets, userId }: TimeEntryFormProps) {
  const [selectedBucket, setSelectedBucket] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splits, setSplits] = useState<BucketSplit[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Calculate total percentage for splits
  const totalPercent = splits.reduce((sum, s) => sum + s.percent, 0);

  // Add a new split
  const addSplit = () => {
    if (splits.length >= buckets.length) return;
    const usedBuckets = splits.map(s => s.bucketId);
    const availableBuckets = buckets.filter(b => !usedBuckets.includes(b.id));
    if (availableBuckets.length === 0) return;

    // Default to remaining percentage split evenly, or 50 if first split
    const remainingPercent = 100 - totalPercent;
    const defaultPercent = splits.length === 0 ? 50 : Math.min(remainingPercent, 50);

    setSplits([...splits, { bucketId: availableBuckets[0].id, percent: defaultPercent }]);
  };

  // Remove a split
  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  // Update a split
  const updateSplit = (index: number, field: 'bucketId' | 'percent', value: string | number) => {
    const newSplits = [...splits];
    if (field === 'bucketId') {
      newSplits[index].bucketId = value as string;
    } else {
      newSplits[index].percent = Number(value);
    }
    setSplits(newSplits);
  };

  // Toggle split mode
  const toggleSplitMode = () => {
    if (!isSplitMode) {
      // Entering split mode - initialize with 2 splits if we have a selected bucket
      if (selectedBucket) {
        setSplits([
          { bucketId: selectedBucket, percent: 50 },
          { bucketId: buckets.find(b => b.id !== selectedBucket)?.id || '', percent: 50 }
        ]);
      } else {
        setSplits([
          { bucketId: buckets[0]?.id || '', percent: 50 },
          { bucketId: buckets[1]?.id || '', percent: 50 }
        ]);
      }
      setSelectedBucket('');
    } else {
      // Exiting split mode - clear splits
      setSplits([]);
    }
    setIsSplitMode(!isSplitMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter a valid number of hours');
      return;
    }

    // Validate based on mode
    if (isSplitMode) {
      if (splits.length < 2) {
        alert('Please add at least 2 buckets for split entry');
        return;
      }
      if (totalPercent !== 100) {
        alert(`Percentages must add up to 100% (currently ${totalPercent}%)`);
        return;
      }
      // Check for empty bucket selections
      if (splits.some(s => !s.bucketId)) {
        alert('Please select a bucket for each split');
        return;
      }
    } else {
      if (!selectedBucket) {
        alert('Please select a bucket');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSplitMode) {
        // Create multiple entries for split mode
        const entries = splits.map(split => ({
          user_id: userId,
          bucket_id: split.bucketId,
          entry_date: date,
          hours: Math.round((hoursNum * split.percent / 100) * 100) / 100, // Round to 2 decimal places
          description: description ? `${description} (${split.percent}% split)` : `${split.percent}% split`,
          entry_type: 'manual' as const,
        }));

        const { error } = await supabase
          .from('time_entries')
          .insert(entries);

        if (error) throw error;
      } else {
        // Single entry mode
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

        if (error) throw error;
      }

      // Reset form
      setSelectedBucket('');
      setHours('');
      setDescription('');
      setSplits([]);
      setIsSplitMode(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating time entry:', error);
      alert('Failed to save time entry');
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

  // Get available buckets for a split (excluding ones already used in other splits)
  const getAvailableBucketsForSplit = (currentIndex: number) => {
    const usedBuckets = splits
      .filter((_, i) => i !== currentIndex)
      .map(s => s.bucketId);
    return buckets.filter(b => !usedBuckets.includes(b.id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Log Time</span>
          </CardTitle>
          <button
            type="button"
            onClick={toggleSplitMode}
            className={`flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              isSplitMode
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>{isSplitMode ? 'Split Mode' : 'Split Entry'}</span>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Single Bucket Selector (when not in split mode) */}
          {!isSplitMode && (
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
          )}

          {/* Split Entry Interface */}
          {isSplitMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Split across buckets
                </label>
                <span className={`text-sm font-medium ${totalPercent === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {totalPercent}% / 100%
                </span>
              </div>

              {splits.map((split, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={split.bucketId}
                    onChange={(e) => updateSplit(index, 'bucketId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select...</option>
                    {getAvailableBucketsForSplit(index).map((bucket) => (
                      <option key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </option>
                    ))}
                    {/* Also show the currently selected bucket */}
                    {split.bucketId && !getAvailableBucketsForSplit(index).find(b => b.id === split.bucketId) && (
                      <option value={split.bucketId}>
                        {buckets.find(b => b.id === split.bucketId)?.name}
                      </option>
                    )}
                  </select>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={split.percent}
                      onChange={(e) => updateSplit(index, 'percent', e.target.value)}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {splits.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeSplit(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Preview of hours split */}
              {hours && parseFloat(hours) > 0 && splits.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-700 mb-1">Split Preview:</div>
                  {splits.map((split, index) => {
                    const bucket = buckets.find(b => b.id === split.bucketId);
                    const splitHours = Math.round((parseFloat(hours) * split.percent / 100) * 100) / 100;
                    return bucket ? (
                      <div key={index} className="text-gray-600">
                        {bucket.name}: {splitHours}h ({split.percent}%)
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Add another split button */}
              {splits.length < buckets.length && (
                <button
                  type="button"
                  onClick={addSplit}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add another bucket</span>
                </button>
              )}
            </div>
          )}

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
