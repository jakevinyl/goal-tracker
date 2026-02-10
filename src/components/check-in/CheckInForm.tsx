'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { SurveyQuestion, CheckInResponse } from '@/lib/types/database';
import { CheckCircle, Target, ChevronDown, ChevronUp, Check, X as XIcon } from 'lucide-react';

interface CheckInFormProps {
  questions: SurveyQuestion[];
  todayResponses: (CheckInResponse & { survey_questions?: SurveyQuestion })[];
  questionGoalMap: Record<string, { goalId: string; goalTitle: string }[]>;
  userId: string;
}

interface QuestionScore {
  questionId: string;
  score: number;
  notes: string;
}

export function CheckInForm({ questions, todayResponses, questionGoalMap, userId }: CheckInFormProps) {
  // Initialize scores from today's responses
  const initialScores: Record<string, QuestionScore> = {};
  questions.forEach(q => {
    const existing = todayResponses.find(r => r.question_id === q.id);
    const isBinary = q.question_type === 'binary';
    initialScores[q.id] = {
      questionId: q.id,
      score: existing?.score ?? (isBinary ? 0 : 5),
      notes: existing?.notes || ''
    };
  });

  const [scores, setScores] = useState<Record<string, QuestionScore>>(initialScores);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    // Auto-expand first question with a linked goal, or first question
    questions.find(q => questionGoalMap[q.id])?.id || questions[0]?.id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(todayResponses.length === questions.length && questions.length > 0);
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
            Run the seed script in Supabase to add questions,
            or add questions manually in settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateScore = (questionId: string, field: 'score' | 'notes', value: number | string) => {
    setScores(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];

    try {
      // Process each question
      for (const question of questions) {
        const scoreData = scores[question.id];
        const existingResponse = todayResponses.find(r => r.question_id === question.id);
        let responseId: string;

        if (existingResponse) {
          // Update existing
          await supabase
            .from('check_in_responses')
            .update({
              score: scoreData.score,
              notes: scoreData.notes || null
            })
            .eq('id', existingResponse.id);
          responseId = existingResponse.id;
        } else {
          // Create new and get the ID back
          const { data: newResponse } = await supabase
            .from('check_in_responses')
            .insert({
              user_id: userId,
              question_id: question.id,
              check_in_date: today,
              score: scoreData.score,
              notes: scoreData.notes || null,
            })
            .select('id')
            .single();
          responseId = newResponse?.id || '';
        }

        // Log to goal_check_in_logs if this question is linked to goals
        const linkedGoals = questionGoalMap[question.id];
        if (linkedGoals && linkedGoals.length > 0 && responseId) {
          for (const goal of linkedGoals) {
            // Check if log already exists for today
            const { data: existingLog } = await supabase
              .from('goal_check_in_logs')
              .select('id')
              .eq('goal_id', goal.goalId)
              .eq('log_date', today)
              .single();

            if (existingLog) {
              // Update existing log
              await supabase
                .from('goal_check_in_logs')
                .update({
                  value: scoreData.score,
                  check_in_response_id: responseId
                })
                .eq('id', existingLog.id);
            } else {
              // Create new log
              await supabase
                .from('goal_check_in_logs')
                .insert({
                  goal_id: goal.goalId,
                  user_id: userId,
                  check_in_response_id: responseId,
                  log_date: today,
                  value: scoreData.score
                });
            }
          }
        }
      }

      setIsComplete(true);
      router.refresh();
    } catch (error) {
      console.error('Error saving check-in:', error);
    }

    setIsSubmitting(false);
  };

  // Separate questions by type
  const scaleQuestions = questions.filter(q => q.question_type !== 'binary');
  const binaryQuestions = questions.filter(q => q.question_type === 'binary');

  // Calculate average score for scale questions only
  const avgScore = scaleQuestions.length > 0
    ? Math.round((scaleQuestions.reduce((sum, q) => sum + scores[q.id].score, 0) / scaleQuestions.length) * 10) / 10
    : 0;

  // Count binary yes responses
  const binaryYesCount = binaryQuestions.reduce((count, q) => count + (scores[q.id].score === 1 ? 1 : 0), 0);

  if (isComplete) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Check-in complete!</h3>
              {scaleQuestions.length > 0 && (
                <p className="text-gray-500 mt-1">
                  Average score: <span className="font-semibold text-blue-600">{avgScore}</span>
                </p>
              )}
              {binaryQuestions.length > 0 && (
                <p className="text-gray-500 mt-1">
                  Completed: <span className="font-semibold text-green-600">{binaryYesCount}/{binaryQuestions.length}</span>
                </p>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {questions.map(q => {
                const scoreData = scores[q.id];
                const linkedGoals = questionGoalMap[q.id];
                const isBinary = q.question_type === 'binary';
                return (
                  <div key={q.id} className="flex items-center justify-between py-1">
                    <span className="flex items-center">
                      {linkedGoals && (
                        <Target className="w-3 h-3 text-purple-500 mr-1" />
                      )}
                      <span className="truncate max-w-[200px]">{q.question_text}</span>
                    </span>
                    {isBinary ? (
                      <span className={`font-medium ml-2 ${scoreData.score === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                        {scoreData.score === 1 ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      <span className="font-medium ml-2">{scoreData.score}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <Button variant="outline" onClick={() => setIsComplete(false)}>
              Edit responses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you doing today?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((question) => {
            const scoreData = scores[question.id];
            const linkedGoals = questionGoalMap[question.id];
            const isExpanded = expandedQuestion === question.id;
            const isBinary = question.question_type === 'binary';

            return (
              <div
                key={question.id}
                className={`border rounded-lg overflow-hidden ${
                  linkedGoals ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                }`}
              >
                {/* Question header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 text-left">
                    {linkedGoals && (
                      <div className="flex-shrink-0" title={`Linked to: ${linkedGoals.map(g => g.goalTitle).join(', ')}`}>
                        <Target className="w-4 h-4 text-purple-500" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{question.question_text}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isBinary ? (
                      <span className={`text-lg font-bold ${scoreData.score === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                        {scoreData.score === 1 ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      <span className={`text-lg font-bold ${
                        scoreData.score >= 7 ? 'text-green-600' :
                        scoreData.score >= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {scoreData.score}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Linked goal indicator */}
                    {linkedGoals && (
                      <div className="text-xs text-purple-600 bg-purple-100 rounded px-2 py-1 inline-flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Tracking: {linkedGoals.map(g => g.goalTitle).join(', ')}
                      </div>
                    )}

                    {isBinary ? (
                      /* Binary Yes/No buttons */
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => updateScore(question.id, 'score', 1)}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            scoreData.score === 1
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                          <span>Yes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateScore(question.id, 'score', 0)}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            scoreData.score === 0
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <XIcon className="w-5 h-5" />
                          <span>No</span>
                        </button>
                      </div>
                    ) : (
                      /* Scale score slider and buttons */
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>1</span>
                            <span>5</span>
                            <span>10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={scoreData.score}
                            onChange={(e) => updateScore(question.id, 'score', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        {/* Quick score buttons */}
                        <div className="flex justify-center space-x-2">
                          {[1, 3, 5, 7, 9, 10].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => updateScore(question.id, 'score', val)}
                              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                scoreData.score === val
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>

                        {/* Baseline reference */}
                        {(question.baseline_score || question.target_score) && (
                          <p className="text-xs text-gray-500 text-center">
                            Baseline: {question.baseline_score || 'N/A'} | Target: {question.target_score || 'Not set'}
                          </p>
                        )}
                      </>
                    )}

                    {/* Notes */}
                    <div>
                      <textarea
                        value={scoreData.notes}
                        onChange={(e) => updateScore(question.id, 'notes', e.target.value)}
                        placeholder="Any notes or reflections..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary and submit */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              {scaleQuestions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Average:</span>
                  <span className="text-2xl font-bold text-blue-600">{avgScore}</span>
                </div>
              )}
              {binaryQuestions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="text-2xl font-bold text-green-600">{binaryYesCount}/{binaryQuestions.length}</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              {todayResponses.length > 0 ? 'Update Check-In' : 'Complete Check-In'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
