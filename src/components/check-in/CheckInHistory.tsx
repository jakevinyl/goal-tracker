'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { CheckInResponse, SurveyQuestion } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/dates';

interface CheckInHistoryProps {
  responses: (CheckInResponse & { survey_questions: SurveyQuestion })[];
}

export function CheckInHistory({ responses }: CheckInHistoryProps) {
  if (responses.length === 0) {
    return null;
  }

  // Get the min and max for color scaling
  const scores = responses.map((r) => r.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  const getScoreColor = (score: number) => {
    // Scale from red (low) to green (high)
    const normalized = (score - 1) / 9; // 1-10 scale to 0-1
    if (normalized < 0.33) return 'bg-red-100 text-red-700';
    if (normalized < 0.5) return 'bg-yellow-100 text-yellow-700';
    if (normalized < 0.7) return 'bg-green-100 text-green-700';
    return 'bg-green-200 text-green-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-Ins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {responses.slice(0, 14).map((response) => (
            <div
              key={response.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 w-24">
                  {formatDate(response.check_in_date, 'EEE, MMM d')}
                </span>
                {response.notes && (
                  <span className="text-sm text-gray-400 truncate max-w-[200px]">
                    {response.notes}
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${getScoreColor(
                  response.score
                )}`}
              >
                {response.score}
              </span>
            </div>
          ))}
        </div>

        {/* Simple sparkline using divs */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Last 14 days</p>
          <div className="flex items-end space-x-1 h-16">
            {responses
              .slice(0, 14)
              .reverse()
              .map((response, index) => {
                const height = (response.score / 10) * 100;
                return (
                  <div
                    key={response.id}
                    className="flex-1 bg-blue-200 rounded-t transition-all hover:bg-blue-400"
                    style={{ height: `${height}%` }}
                    title={`${formatDate(response.check_in_date, 'MMM d')}: ${response.score}`}
                  />
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
