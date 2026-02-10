'use client';

import { useMemo } from 'react';
import type { Goal, SurveyQuestion, GoalCheckInLog } from '@/lib/types/database';
import { Target, TrendingUp, TrendingDown, Minus, CheckCircle, ToggleLeft, Sliders } from 'lucide-react';

interface GoalProgressSectionProps {
  goals: (Goal & { survey_questions?: SurveyQuestion })[];
  goalCheckInLogs: GoalCheckInLog[];
  daysBack: number;
}

interface GoalProgress {
  goal: Goal & { survey_questions?: SurveyQuestion };
  logs: GoalCheckInLog[];
  currentValue: number;
  targetValue: number | null;
  progressPercent: number;
  trend: 'up' | 'down' | 'flat';
  isBinary: boolean;
}

export function GoalProgressSection({ goals, goalCheckInLogs, daysBack }: GoalProgressSectionProps) {
  const goalProgressData = useMemo(() => {
    return goals.map(goal => {
      const logs = goalCheckInLogs.filter(log => log.goal_id === goal.id);
      const isBinary = goal.survey_questions?.question_type === 'binary';

      let currentValue: number;
      let progressPercent: number;
      let trend: 'up' | 'down' | 'flat' = 'flat';

      if (isBinary) {
        // For binary: count of "yes" (value = 1)
        currentValue = logs.filter(log => log.value === 1).length;
        progressPercent = goal.target_value
          ? Math.min(100, (currentValue / goal.target_value) * 100)
          : 0;
      } else {
        // For scale: average of all values
        currentValue = logs.length > 0
          ? logs.reduce((sum, log) => sum + Number(log.value), 0) / logs.length
          : 0;
        currentValue = Math.round(currentValue * 10) / 10;

        progressPercent = goal.target_value
          ? Math.min(100, (currentValue / goal.target_value) * 100)
          : 0;
      }

      // Calculate trend (compare first half to second half)
      if (logs.length >= 4) {
        const midpoint = Math.floor(logs.length / 2);
        const firstHalf = logs.slice(0, midpoint);
        const secondHalf = logs.slice(midpoint);

        const firstAvg = firstHalf.reduce((sum, log) => sum + Number(log.value), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, log) => sum + Number(log.value), 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.3) trend = 'up';
        else if (secondAvg < firstAvg - 0.3) trend = 'down';
      }

      return {
        goal,
        logs,
        currentValue,
        targetValue: goal.target_value,
        progressPercent,
        trend,
        isBinary
      } as GoalProgress;
    });
  }, [goals, goalCheckInLogs]);

  if (goals.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No goals with linked measures</p>
        <p className="text-sm text-gray-400 mt-1">
          Link a measure to a goal to track progress here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goalProgressData.map(({ goal, logs, currentValue, targetValue, progressPercent, trend, isBinary }) => (
        <div
          key={goal.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors"
        >
          {/* Goal header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {isBinary ? (
                  <ToggleLeft className="w-4 h-4 text-green-600" />
                ) : (
                  <Sliders className="w-4 h-4 text-blue-600" />
                )}
                <h3 className="font-medium text-gray-900">{goal.title}</h3>
              </div>
              {goal.survey_questions && (
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  {goal.survey_questions.question_text}
                </p>
              )}
            </div>

            {/* Trend indicator */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' :
              trend === 'down' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'flat' && <Minus className="w-3 h-3" />}
              <span>{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Steady'}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {isBinary ? (
                  <>
                    <span className="font-semibold text-gray-900">{currentValue}</span>
                    {targetValue && <span> / {targetValue}</span>}
                    <span className="text-gray-400"> times</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">{currentValue}</span>
                    {targetValue && <span> / {targetValue}</span>}
                    <span className="text-gray-400"> avg</span>
                  </>
                )}
              </span>
              {targetValue && (
                <span className={`font-medium ${
                  progressPercent >= 100 ? 'text-green-600' :
                  progressPercent >= 75 ? 'text-blue-600' :
                  progressPercent >= 50 ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {Math.round(progressPercent)}%
                </span>
              )}
            </div>

            {targetValue && (
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 100 ? 'bg-green-500' :
                    progressPercent >= 75 ? 'bg-blue-500' :
                    progressPercent >= 50 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>{logs.length} check-ins in last {daysBack} days</span>
              {progressPercent >= 100 && (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Target reached!
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
