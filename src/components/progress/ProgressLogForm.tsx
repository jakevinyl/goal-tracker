'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Bucket, Goal } from '@/lib/types/database';
import { Plus, Hash } from 'lucide-react';

interface ProgressLogFormProps {
  buckets: Bucket[];
  goals: Goal[];
  userId: string;
}

const COMMON_TAGS = ['win', 'learning', 'blocker', 'milestone', 'reflection', 'gratitude'];

export function ProgressLogForm({ buckets, goals, userId }: ProgressLogFormProps) {
  const [content, setContent] = useState('');
  const [selectedBucketId, setSelectedBucketId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Filter goals by selected bucket
  const filteredGoals = selectedBucketId
    ? goals.filter(g => g.bucket_id === selectedBucketId)
    : goals;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('progress_log_entries')
      .insert({
        user_id: userId,
        bucket_id: selectedBucketId || null,
        goal_id: selectedGoalId || null,
        entry_date: new Date().toISOString().split('T')[0],
        content: content.trim(),
        tags: selectedTags,
      });

    if (error) {
      console.error('Error creating progress log:', error);
      alert('Failed to save entry');
    } else {
      setContent('');
      setSelectedBucketId('');
      setSelectedGoalId('');
      setSelectedTags([]);
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Log Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a win, learning, reflection, or anything else..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Bucket and Goal Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Life Area (optional)
              </label>
              <select
                value={selectedBucketId}
                onChange={(e) => {
                  setSelectedBucketId(e.target.value);
                  setSelectedGoalId(''); // Reset goal when bucket changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All areas</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal (optional)
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No specific goal</option>
                {filteredGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tags that were added */}
            {selectedTags.filter(t => !COMMON_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.filter(t => !COMMON_TAGS.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-purple-100 text-purple-700 border border-purple-300"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                    <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Add custom tag */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Add custom tag..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomTag}
                disabled={!customTag.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Save Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
