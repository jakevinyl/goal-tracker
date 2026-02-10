'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion } from '@/lib/types/database';
import { BarChart3, X } from 'lucide-react';

interface MeasureFormProps {
  userId: string;
  editingMeasure?: SurveyQuestion;
  onCancel?: () => void;
  onSaved?: () => void;
}

export function MeasureForm({ userId, editingMeasure, onCancel, onSaved }: MeasureFormProps) {
  const [questionText, setQuestionText] = useState(editingMeasure?.question_text || '');
  const [baselineScore, setBaselineScore] = useState(editingMeasure?.baseline_score?.toString() || '5');
  const [targetScore, setTargetScore] = useState(editingMeasure?.target_score?.toString() || '');
  const [isActive, setIsActive] = useState(editingMeasure?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    setIsSubmitting(true);

    const measureData = {
      user_id: userId,
      question_text: questionText.trim(),
      baseline_score: parseFloat(baselineScore) || 5,
      target_score: targetScore ? parseFloat(targetScore) : null,
      is_active: isActive,
      sort_order: editingMeasure?.sort_order || 0,
    };

    let error;

    if (editingMeasure) {
      const result = await supabase
        .from('survey_questions')
        .update(measureData)
        .eq('id', editingMeasure.id);
      error = result.error;
    } else {
      // Get max sort_order for new questions
      const { data: maxOrder } = await supabase
        .from('survey_questions')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      measureData.sort_order = (maxOrder?.sort_order || 0) + 1;

      const result = await supabase
        .from('survey_questions')
        .insert(measureData);
      error = result.error;
    }

    if (error) {
      console.error('Error saving measure:', error);
      alert('Failed to save measure');
    } else {
      if (!editingMeasure) {
        setQuestionText('');
        setBaselineScore('5');
        setTargetScore('');
        setIsActive(true);
      }
      onSaved?.();
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{editingMeasure ? 'Edit Measure' : 'Add Measure'}</span>
          </CardTitle>
          {onCancel && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question / Measure *
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., How satisfied are you with your health?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in your daily check-in. Score range is 1-10.
            </p>
          </div>

          {/* Baseline and Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baseline Score
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={baselineScore}
                onChange={(e) => setBaselineScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your starting point (1-10)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Score
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where you want to be (1-10)
              </p>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Include in daily check-in
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingMeasure ? 'Update Measure' : 'Add Measure'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
