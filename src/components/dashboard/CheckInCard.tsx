'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CheckInResponse, SurveyQuestion } from '@/lib/types/database';
import { calculateStreak, toLocalDateString } from '@/lib/utils/dates';
import { calculateAverage } from '@/lib/utils/calculations';

interface CheckInCardProps {
  checkIns: (CheckInResponse & { survey_questions: SurveyQuestion })[];
  todayCheckIn?: CheckInResponse;
}

export function CheckInCard({ checkIns, todayCheckIn }: CheckInCardProps) {
  // Calculate streak
  const checkInDates = checkIns.map((c) => c.check_in_date);
  const streak = calculateStreak(checkInDates);

  // Calculate averages
  const last7Days = checkIns.filter((c) => {
    const date = new Date(c.check_in_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  });

  const last30Days = checkIns.filter((c) => {
    const date = new Date(c.check_in_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const avg7 = calculateAverage(last7Days);
  const avg30 = calculateAverage(last30Days);

  // Determine trend
  const trend = avg7 > avg30 ? 'up' : avg7 < avg30 ? 'down' : 'neutral';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Check-In</CardTitle>
          <div className="flex items-center space-x-1 text-orange-500">
            <Flame className="w-5 h-5" />
            <span className="font-semibold">{streak}</span>
            <span className="text-sm text-gray-500">day{streak !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todayCheckIn ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {todayCheckIn.score}
              </div>
              <p className="text-sm text-gray-500 mt-1">Today&apos;s score</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{avg7 || '-'}</div>
                <p className="text-xs text-gray-500">7-day avg</p>
              </div>
              <div className="flex items-center space-x-1">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{avg30 || '-'}</div>
                <p className="text-xs text-gray-500">30-day avg</p>
              </div>
            </div>

            <Link href="/dashboard/daily">
              <Button variant="outline" className="w-full">
                View history
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="py-6">
              <p className="text-gray-500 mb-4">You haven&apos;t checked in today</p>
              <Link href="/dashboard/daily">
                <Button size="lg">
                  Check In Now
                </Button>
              </Link>
            </div>

            {checkIns.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm text-gray-500">
                <span>7-day avg: {avg7 || '-'}</span>
                <span>30-day avg: {avg30 || '-'}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
