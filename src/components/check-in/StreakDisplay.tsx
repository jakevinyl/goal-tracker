'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CheckInResponse, SurveyQuestion } from '@/lib/types/database';
import { calculateStreak } from '@/lib/utils/dates';
import { calculateAverage } from '@/lib/utils/calculations';

interface StreakDisplayProps {
  responses: (CheckInResponse & { survey_questions: SurveyQuestion })[];
}

export function StreakDisplay({ responses }: StreakDisplayProps) {
  const checkInDates = responses.map((r) => r.check_in_date);
  const streak = calculateStreak(checkInDates);

  // Calculate averages
  const last7Days = responses.filter((r) => {
    const date = new Date(r.check_in_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  });

  const last30Days = responses;
  const avg7 = calculateAverage(last7Days);
  const avg30 = calculateAverage(last30Days);

  // Determine trend
  const trend = avg7 > avg30 ? 'up' : avg7 < avg30 ? 'down' : 'neutral';

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Streak */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{streak}</p>
              <p className="text-sm text-gray-500">day streak</p>
            </div>
          </div>

          {/* Averages */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{avg7 || '-'}</p>
              <p className="text-xs text-gray-500">7-day avg</p>
            </div>

            <div className="flex items-center">
              {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
              {trend === 'neutral' && <Minus className="w-5 h-5 text-gray-400" />}
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{avg30 || '-'}</p>
              <p className="text-xs text-gray-500">30-day avg</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
