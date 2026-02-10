'use client';

import { useMemo, useState } from 'react';
import type { SurveyQuestion, CheckInResponse } from '@/lib/types/database';
import { Sliders, ToggleLeft, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CheckInTrendsSectionProps {
  checkInResponses: (CheckInResponse & { survey_questions?: SurveyQuestion })[];
  questions: SurveyQuestion[];
  daysBack: number;
}

interface QuestionTrend {
  question: SurveyQuestion;
  responses: CheckInResponse[];
  average: number;
  completionRate: number; // For binary: % of days with "yes"
  checkInCount: number;
  trend: 'up' | 'down' | 'flat';
  dailyData: { date: string; value: number }[];
}

export function CheckInTrendsSection({ checkInResponses, questions, daysBack }: CheckInTrendsSectionProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const questionTrends = useMemo(() => {
    return questions.map(question => {
      const responses = checkInResponses.filter(r => r.question_id === question.id);
      const isBinary = question.question_type === 'binary';

      // Calculate daily data
      const dailyData: { date: string; value: number }[] = [];
      const responsesByDate = new Map<string, number>();
      responses.forEach(r => {
        responsesByDate.set(r.check_in_date, r.score);
      });

      // Fill in dates
      const today = new Date();
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const value = responsesByDate.get(dateStr);
        if (value !== undefined) {
          dailyData.push({ date: dateStr, value });
        }
      }

      // Calculate metrics
      let average = 0;
      let completionRate = 0;

      if (responses.length > 0) {
        if (isBinary) {
          const yesCount = responses.filter(r => r.score === 1).length;
          completionRate = Math.round((yesCount / responses.length) * 100);
          average = yesCount;
        } else {
          average = Math.round((responses.reduce((sum, r) => sum + r.score, 0) / responses.length) * 10) / 10;
        }
      }

      // Calculate trend
      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (dailyData.length >= 4) {
        const midpoint = Math.floor(dailyData.length / 2);
        const firstHalf = dailyData.slice(0, midpoint);
        const secondHalf = dailyData.slice(midpoint);

        const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.3) trend = 'up';
        else if (secondAvg < firstAvg - 0.3) trend = 'down';
      }

      return {
        question,
        responses,
        average,
        completionRate,
        checkInCount: responses.length,
        trend,
        dailyData
      } as QuestionTrend;
    });
  }, [checkInResponses, questions, daysBack]);

  const selectedTrend = selectedQuestion
    ? questionTrends.find(t => t.question.id === selectedQuestion)
    : null;

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No active measures to track</p>
        <p className="text-sm text-gray-400 mt-1">
          Add measures on the Measures page to see trends
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionTrends.map(({ question, average, completionRate, checkInCount, trend, dailyData }) => {
          const isBinary = question.question_type === 'binary';
          const isSelected = selectedQuestion === question.id;

          return (
            <button
              key={question.id}
              onClick={() => setSelectedQuestion(isSelected ? null : question.id)}
              className={`text-left p-4 border rounded-lg transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {isBinary ? (
                    <ToggleLeft className="w-4 h-4 text-green-600" />
                  ) : (
                    <Sliders className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">
                    {question.question_text}
                  </span>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs ${
                  trend === 'up' ? 'bg-green-100 text-green-700' :
                  trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {trend === 'flat' && <Minus className="w-3 h-3" />}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div>
                  {isBinary ? (
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
                      <span className="text-sm text-gray-500 ml-1">yes rate</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{average}</span>
                      <span className="text-sm text-gray-500 ml-1">avg</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {checkInCount} check-ins
                </div>
              </div>

              {/* Mini sparkline */}
              <div className="mt-3 h-8 flex items-end space-x-0.5">
                {dailyData.slice(-14).map((d, i) => {
                  const maxVal = isBinary ? 1 : 10;
                  const height = (d.value / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all ${
                        isBinary
                          ? d.value === 1 ? 'bg-green-400' : 'bg-gray-200'
                          : d.value >= 7 ? 'bg-green-400' :
                            d.value >= 4 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ height: `${Math.max(10, height)}%` }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed view for selected question */}
      {selectedTrend && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
          <h4 className="font-medium text-gray-900 mb-4">
            {selectedTrend.question.question_text}
          </h4>

          {/* Detailed bar chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Daily scores (last {Math.min(selectedTrend.dailyData.length, 30)} days)</span>
              <span>
                {selectedTrend.question.question_type === 'binary' ? 'Yes/No' : '1-10 scale'}
              </span>
            </div>

            <div className="h-40 flex items-end space-x-1">
              {selectedTrend.dailyData.slice(-30).map((d, i) => {
                const isBinary = selectedTrend.question.question_type === 'binary';
                const maxVal = isBinary ? 1 : 10;
                const height = (d.value / maxVal) * 100;
                const date = new Date(d.date);
                const dayLabel = date.getDate();

                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isBinary
                          ? d.value === 1 ? 'bg-green-500' : 'bg-gray-300'
                          : d.value >= 7 ? 'bg-green-500' :
                            d.value >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${Math.max(5, height)}%` }}
                      title={`${d.date}: ${isBinary ? (d.value === 1 ? 'Yes' : 'No') : d.value}`}
                    />
                    {i % 7 === 0 && (
                      <span className="text-[10px] text-gray-400 mt-1">{dayLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 mt-2">
              {selectedTrend.question.question_type === 'binary' ? (
                <>
                  <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded mr-1" /> Yes</span>
                  <span className="flex items-center"><span className="w-3 h-3 bg-gray-300 rounded mr-1" /> No</span>
                </>
              ) : (
                <>
                  <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded mr-1" /> 7-10</span>
                  <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded mr-1" /> 4-6</span>
                  <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded mr-1" /> 1-3</span>
                </>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {selectedTrend.checkInCount}
              </div>
              <div className="text-xs text-gray-500">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {selectedTrend.question.question_type === 'binary'
                  ? `${selectedTrend.completionRate}%`
                  : selectedTrend.average}
              </div>
              <div className="text-xs text-gray-500">
                {selectedTrend.question.question_type === 'binary' ? 'Yes Rate' : 'Average'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                selectedTrend.trend === 'up' ? 'text-green-600' :
                selectedTrend.trend === 'down' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {selectedTrend.trend === 'up' ? '↑' : selectedTrend.trend === 'down' ? '↓' : '→'}
              </div>
              <div className="text-xs text-gray-500">Trend</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
