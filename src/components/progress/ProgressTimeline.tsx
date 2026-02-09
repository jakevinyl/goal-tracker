'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { ProgressLogEntry, CheckInResponse, SurveyQuestion, Bucket, Goal } from '@/lib/types/database';
import {
  BookOpen,
  CheckCircle,
  Hash,
  Target,
  Folder,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

interface ProgressTimelineProps {
  progressLogs: (ProgressLogEntry & { bucket?: Bucket; goal?: Goal })[];
  checkIns: (CheckInResponse & { question: SurveyQuestion })[];
  buckets: Bucket[];
}

type TimelineItem = {
  id: string;
  type: 'progress' | 'checkin';
  date: string;
  data: ProgressLogEntry & { bucket?: Bucket; goal?: Goal } | (CheckInResponse & { question: SurveyQuestion });
};

export function ProgressTimeline({ progressLogs, checkIns, buckets }: ProgressTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'progress' | 'checkin'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Combine and sort timeline items
  const timelineItems: TimelineItem[] = [
    ...progressLogs.map(log => ({
      id: `progress-${log.id}`,
      type: 'progress' as const,
      date: log.entry_date,
      data: log,
    })),
    ...checkIns.map(ci => ({
      id: `checkin-${ci.id}`,
      type: 'checkin' as const,
      date: ci.check_in_date,
      data: ci,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply filters
  const filteredItems = timelineItems.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (tagFilter && item.type === 'progress') {
      const log = item.data as ProgressLogEntry;
      if (!log.tags?.includes(tagFilter)) return false;
    }
    return true;
  });

  // Group by date
  const groupedByDate = filteredItems.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const dates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get all unique tags from progress logs
  const allTags = [...new Set(progressLogs.flatMap(log => log.tags || []))];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // By default, expand today and yesterday
  const isExpanded = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString() || d.toDateString() === yesterday.toDateString()) {
      return !expandedDates.has(date); // Invert for these dates (expanded by default)
    }
    return expandedDates.has(date);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'win': return 'bg-green-100 text-green-700';
      case 'learning': return 'bg-blue-100 text-blue-700';
      case 'blocker': return 'bg-red-100 text-red-700';
      case 'milestone': return 'bg-purple-100 text-purple-700';
      case 'reflection': return 'bg-yellow-100 text-yellow-700';
      case 'gratitude': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Timeline</span>
          </CardTitle>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'progress' | 'checkin')}
              className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All entries</option>
              <option value="progress">Progress logs</option>
              <option value="checkin">Check-ins</option>
            </select>

            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No entries yet. Start logging your progress!
          </p>
        ) : (
          <div className="space-y-4">
            {dates.map(date => (
              <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Date header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{formatDate(date)}</span>
                    <span className="text-sm text-gray-500">
                      ({groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>
                  {isExpanded(date) ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {/* Entries for this date */}
                {isExpanded(date) && (
                  <div className="divide-y divide-gray-100">
                    {groupedByDate[date].map(item => (
                      <div key={item.id} className="px-4 py-3">
                        {item.type === 'progress' ? (
                          <ProgressLogItem
                            log={item.data as ProgressLogEntry & { bucket?: Bucket; goal?: Goal }}
                            getTagColor={getTagColor}
                          />
                        ) : (
                          <CheckInItem
                            checkIn={item.data as CheckInResponse & { question: SurveyQuestion }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressLogItem({
  log,
  getTagColor
}: {
  log: ProgressLogEntry & { bucket?: Bucket; goal?: Goal };
  getTagColor: (tag: string) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900">{log.content}</p>

          <div className="flex items-center flex-wrap gap-2 mt-2">
            {/* Bucket tag */}
            {log.bucket && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${log.bucket.color}20`,
                  color: log.bucket.color
                }}
              >
                <Folder className="w-3 h-3 mr-1" />
                {log.bucket.name}
              </span>
            )}

            {/* Goal tag */}
            {log.goal && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                <Target className="w-3 h-3 mr-1" />
                {log.goal.title}
              </span>
            )}

            {/* Tags */}
            {log.tags?.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tag)}`}
              >
                <Hash className="w-3 h-3 mr-0.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInItem({ checkIn }: { checkIn: CheckInResponse & { question: SurveyQuestion } }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="text-gray-700 text-sm">{checkIn.question.question_text}</p>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getScoreColor(checkIn.score)}`}>
            {checkIn.score}
          </span>
        </div>
        {checkIn.notes && (
          <p className="text-gray-500 text-sm mt-1 italic">"{checkIn.notes}"</p>
        )}
      </div>
    </div>
  );
}
