'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion, CheckInResponse } from '@/lib/types/database';
import { CheckCircle } from 'lucide-react';

interface CheckInFormProps {
  questions: SurveyQuestion[];
  todayResponse?: CheckInResponse & { survey_questions: SurveyQuestion };
  userId: string;
}

export function CheckInForm({ questions, todayResponse, userId }: CheckInFormProps) {
  const [score, setScore] = useState<number>(todayResponse?.score || 5);
  const [notes, setNotes] = useState(todayResponse?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(!!todayResponse);
  const router = useRouter();
  const supabase = createClient();

  // If no questions exist, show setup message
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500 mb-4">
            No check-in questions configured yet.
          </p>
          <p className="text-sm text-gray-400">
            Run the seed script in Supabase to add the default question,
            or add questions manually in settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const question = questions[0]; // For now, just use the first question

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];

    if (todayResponse) {
      // Update existing response
      const { error } = await supabase
        .from('check_in_responses')
        .update({ score, notes })
        .eq('id', todayResponse.id);

      if (error) {
        console.error('Error updating check-in:', error);
        setIsSubmitting(false);
        return;
      }
    } else {
      // Create new response
      const { error } = await supabase
        .from('check_in_responses')
        .insert({
          user_id: userId,
          question_id: question.id,
          check_in_date: today,
          score,
          notes: notes || null,
        });

      if (error) {
        console.error('Error creating check-in:', error);
        setIsSubmitting(false);
        return;
      }
    }

    setIsComplete(true);
    setIsSubmitting(false);
    router.refresh();
  };

  if (isComplete && todayResponse) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Check-in complete!</h3>
              <p className="text-gray-500 mt-1">
                You scored <span className="font-semibold text-blue-600">{score}</span> today
              </p>
            </div>
            {notes && (
              <p className="text-sm text-gray-600 italic">&ldquo;{notes}&rdquo;</p>
            )}
            <Button variant="outline" onClick={() => setIsComplete(false)}>
              Edit response
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question.question_text}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Score Slider */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center">
              <span className="text-5xl font-bold text-blue-600">{score}</span>
            </div>
          </div>

          {/* Quick Score Buttons */}
          <div className="flex justify-center space-x-2">
            {[1, 3, 5, 7, 9, 10].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setScore(val)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  score === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts or reflections..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Baseline reference */}
          {question.baseline_score && (
            <p className="text-sm text-gray-500 text-center">
              Baseline: {question.baseline_score} | Target: {question.target_score || 'Not set'}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
          >
            {todayResponse ? 'Update Check-In' : 'Complete Check-In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
