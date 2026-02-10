'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { Goal, SurveyQuestion, Bucket, TimeTarget, GoalCheckInLog, CheckInResponse, TimeEntry } from '@/lib/types/database';
import { Target, TrendingUp, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { GoalProgressSection } from './GoalProgressSection';
import { CheckInTrendsSection } from './CheckInTrendsSection';
import { TimeAllocationSection } from './TimeAllocationSection';

interface TrendsPageClientProps {
  goals: (Goal & { survey_questions?: SurveyQuestion })[];
  goalCheckInLogs: GoalCheckInLog[];
  checkInResponses: (CheckInResponse & { survey_questions?: SurveyQuestion })[];
  questions: SurveyQuestion[];
  timeEntries: (TimeEntry & { buckets?: Bucket })[];
  buckets: Bucket[];
  timeTargets: TimeTarget[];
}

type TimeRange = '7d' | '30d' | '90d';

export function TrendsPageClient({
  goals,
  goalCheckInLogs,
  checkInResponses,
  questions,
  timeEntries,
  buckets,
  timeTargets
}: TrendsPageClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [expandedSections, setExpandedSections] = useState({
    goals: true,
    checkIns: true,
    time: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    return {
      goalCheckInLogs: goalCheckInLogs.filter(log => log.log_date >= startDateStr),
      checkInResponses: checkInResponses.filter(r => r.check_in_date >= startDateStr),
      timeEntries: timeEntries.filter(e => e.entry_date >= startDateStr),
      startDate: startDateStr,
      daysBack
    };
  }, [goalCheckInLogs, checkInResponses, timeEntries, timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trends & Analytics</h1>
          <p className="text-gray-500">Track your progress over time</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Goal Progress Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('goals')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Goal Progress</span>
              {goals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                  {goals.length} active
                </span>
              )}
            </CardTitle>
            {expandedSections.goals ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.goals && (
          <CardContent>
            <GoalProgressSection
              goals={goals}
              goalCheckInLogs={filteredData.goalCheckInLogs}
              daysBack={filteredData.daysBack}
            />
          </CardContent>
        )}
      </Card>

      {/* Check-in Trends Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('checkIns')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Check-in Trends</span>
            </CardTitle>
            {expandedSections.checkIns ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.checkIns && (
          <CardContent>
            <CheckInTrendsSection
              checkInResponses={filteredData.checkInResponses}
              questions={questions}
              daysBack={filteredData.daysBack}
            />
          </CardContent>
        )}
      </Card>

      {/* Time Allocation Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('time')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Time Allocation</span>
            </CardTitle>
            {expandedSections.time ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </CardHeader>
        {expandedSections.time && (
          <CardContent>
            <TimeAllocationSection
              timeEntries={filteredData.timeEntries}
              buckets={buckets}
              timeTargets={timeTargets}
              daysBack={filteredData.daysBack}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
