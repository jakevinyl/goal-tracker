'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/types/database';
import { Plus, X } from 'lucide-react';

interface BucketFormProps {
  buckets: Bucket[];
  userId: string;
  editingBucket?: Bucket | null;
  onClose?: () => void;
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
];

export function BucketForm({ buckets, userId, editingBucket, onClose }: BucketFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [parentBucketId, setParentBucketId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Populate form when editing
  useEffect(() => {
    if (editingBucket) {
      setName(editingBucket.name);
      setDescription(editingBucket.description || '');
      setColor(editingBucket.color);
      setParentBucketId(editingBucket.parent_bucket_id || '');
      setIsExpanded(true);
    }
  }, [editingBucket]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('#3B82F6');
    setParentBucketId('');
    setIsExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a bucket name');
      return;
    }

    setIsSubmitting(true);

    if (editingBucket) {
      // Update existing bucket
      const { error } = await supabase
        .from('buckets')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          color,
          parent_bucket_id: parentBucketId || null,
        })
        .eq('id', editingBucket.id);

      if (error) {
        console.error('Error updating bucket:', error);
        alert('Failed to update bucket');
      } else {
        resetForm();
        if (onClose) onClose();
        router.refresh();
      }
    } else {
      // Create new bucket
      const maxSortOrder = Math.max(0, ...buckets.map(b => b.sort_order));

      const { error } = await supabase
        .from('buckets')
        .insert({
          user_id: userId,
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon: 'folder',
          parent_bucket_id: parentBucketId || null,
          sort_order: maxSortOrder + 1,
          is_active: true,
        });

      if (error) {
        console.error('Error creating bucket:', error);
        alert('Failed to create bucket');
      } else {
        resetForm();
        router.refresh();
      }
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose();
  };

  // Get top-level buckets for parent selection (exclude self and children when editing)
  const availableParents = buckets.filter(b => {
    if (!b.parent_bucket_id) {
      // Only show top-level buckets as potential parents
      if (editingBucket) {
        // Don't allow setting self as parent
        return b.id !== editingBucket.id;
      }
      return true;
    }
    return false;
  });

  // Collapsed state
  if (!isExpanded && !editingBucket) {
    return (
      <Card>
        <CardContent className="py-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add a life area...</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{editingBucket ? 'Edit Bucket' : 'New Life Area'}</span>
          </CardTitle>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Health, Career, Family"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
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
              placeholder="What does this area cover?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === presetColor
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          {/* Parent Bucket */}
          {availableParents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Bucket (optional)
              </label>
              <select
                value={parentBucketId}
                onChange={(e) => setParentBucketId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None (top-level)</option>
                {availableParents.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Make this a sub-bucket of another area
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {editingBucket ? 'Save Changes' : 'Add Bucket'}
            </Button>
            {editingBucket && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
