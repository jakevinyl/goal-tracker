'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion } from '@/lib/types/database';
import { Gauge, X, ToggleLeft, Sliders } from 'lucide-react';

interface MeasureFormProps {
  userId: string;
  editingMeasure?: SurveyQuestion;
  onCancel?: () => void;
  onSaved?: () => void;
}

export function MeasureForm({ userId, editingMeasure, onCancel, onSaved }: MeasureFormProps) {
  const [questionText, setQuestionText] = useState(editingMeasure?.question_text || '');
  const [questionType, setQuestionType] = useState<'scale' | 'binary'>(
    editingMeasure?.question_type || 'scale'
  );
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
      question_type: questionType,
      baseline_score: questionType === 'binary'
        ? 0
        : (parseFloat(baselineScore) || 5),
      target_score: questionType === 'binary'
        ? null
        : (targetScore ? parseFloat(targetScore) : null),
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
        setQuestionType('scale');
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
            <Gauge className="w-5 h-5" />
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
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measure Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuestionType('scale')}
                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  questionType === 'scale'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Sliders className={`w-5 h-5 ${questionType === 'scale' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium">Scale (1-10)</div>
                  <div className="text-xs text-gray-500">Rate yourself daily</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('binary')}
                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  questionType === 'binary'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <ToggleLeft className={`w-5 h-5 ${questionType === 'binary' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium">Binary (Yes/No)</div>
                  <div className="text-xs text-gray-500">Did you or didn't you</div>
                </div>
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={
                questionType === 'binary'
                  ? "e.g., Did you exercise today?"
                  : "e.g., How satisfied are you with your health?"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {questionType === 'binary'
                ? "Answer will be Yes or No. 'Yes' counts as 1, 'No' as 0."
                : "You'll rate this 1-10 in your daily check-in."
              }
            </p>
          </div>

          {/* Baseline and Target (only for scale) */}
          {questionType === 'scale' && (
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
          )}

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
