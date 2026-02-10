'use client';

import { useMemo } from 'react';
import type { Bucket, TimeTarget, TimeEntry } from '@/lib/types/database';
import { Clock, Target, AlertCircle } from 'lucide-react';

interface TimeAllocationSectionProps {
  timeEntries: (TimeEntry & { buckets?: Bucket })[];
  buckets: Bucket[];
  timeTargets: TimeTarget[];
  daysBack: number;
}

interface BucketTimeData {
  bucket: Bucket;
  totalHours: number;
  targetPercent: number | null;
  actualPercent: number;
  difference: number; // positive = over target, negative = under
  weeklyData: { week: string; hours: number }[];
}

export function TimeAllocationSection({
  timeEntries,
  buckets,
  timeTargets,
  daysBack
}: TimeAllocationSectionProps) {
  const timeData = useMemo(() => {
    // Calculate total hours
    const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);

    // Build target map
    const targetMap = new Map<string, number>();
    timeTargets.forEach(t => {
      targetMap.set(t.bucket_id, t.target_percent);
    });

    // Calculate per-bucket data
    const bucketData: BucketTimeData[] = buckets.map(bucket => {
      const bucketEntries = timeEntries.filter(e => e.bucket_id === bucket.id);
      const bucketHours = bucketEntries.reduce((sum, e) => sum + e.hours, 0);
      const targetPercent = targetMap.get(bucket.id) ?? null;
      const actualPercent = totalHours > 0 ? (bucketHours / totalHours) * 100 : 0;
      const difference = targetPercent !== null ? actualPercent - targetPercent : 0;

      // Calculate weekly data
      const weeklyMap = new Map<string, number>();
      bucketEntries.forEach(e => {
        const date = new Date(e.entry_date);
        // Get week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const weekKey = `W${weekNum}`;
        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + e.hours);
      });

      const weeklyData = Array.from(weeklyMap.entries())
        .map(([week, hours]) => ({ week, hours }))
        .sort((a, b) => a.week.localeCompare(b.week));

      return {
        bucket,
        totalHours: Math.round(bucketHours * 10) / 10,
        targetPercent,
        actualPercent: Math.round(actualPercent * 10) / 10,
        difference: Math.round(difference * 10) / 10,
        weeklyData
      };
    }).filter(b => b.totalHours > 0 || b.targetPercent !== null)
      .sort((a, b) => b.totalHours - a.totalHours);

    // Calculate daily totals for sparkline
    const dailyTotals = new Map<string, number>();
    timeEntries.forEach(e => {
      dailyTotals.set(e.entry_date, (dailyTotals.get(e.entry_date) || 0) + e.hours);
    });

    const dailyData = Array.from(dailyTotals.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgPerDay: totalHours > 0 ? Math.round((totalHours / daysBack) * 10) / 10 : 0,
      daysTracked: dailyTotals.size,
      bucketData,
      dailyData
    };
  }, [timeEntries, buckets, timeTargets, daysBack]);

  if (timeEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No time entries in this period</p>
        <p className="text-sm text-gray-400 mt-1">
          Log time on the Time Tracking page to see trends
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.totalHours}h</div>
          <div className="text-sm text-gray-500">Total tracked</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.avgPerDay}h</div>
          <div className="text-sm text-gray-500">Avg per day</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{timeData.daysTracked}</div>
          <div className="text-sm text-gray-500">Days tracked</div>
        </div>
      </div>

      {/* Daily hours sparkline */}
      {timeData.dailyData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Daily hours</h4>
          <div className="h-16 flex items-end space-x-0.5">
            {timeData.dailyData.slice(-30).map((d, i) => {
              const maxHours = Math.max(...timeData.dailyData.map(x => x.hours), 8);
              const height = (d.hours / maxHours) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-blue-400 rounded-t hover:bg-blue-500 transition-colors"
                  style={{ height: `${Math.max(5, height)}%` }}
                  title={`${d.date}: ${d.hours}h`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Bucket breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Time by life area</h4>
        <div className="space-y-3">
          {timeData.bucketData.map(({ bucket, totalHours, targetPercent, actualPercent, difference }) => (
            <div key={bucket.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{bucket.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{totalHours}h</span>
                  <span className="text-sm font-medium text-gray-900">{actualPercent}%</span>
                  {targetPercent !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      Math.abs(difference) <= 5 ? 'bg-green-100 text-green-700' :
                      difference > 0 ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {difference > 0 ? '+' : ''}{difference}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar showing actual vs target */}
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                {/* Actual */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, actualPercent)}%`,
                    backgroundColor: bucket.color
                  }}
                />
                {/* Target marker */}
                {targetPercent !== null && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-gray-800"
                    style={{ left: `${Math.min(100, targetPercent)}%` }}
                    title={`Target: ${targetPercent}%`}
                  />
                )}
              </div>

              {/* Target indicator */}
              {targetPercent !== null && (
                <div className="flex items-center justify-end text-xs text-gray-500">
                  <Target className="w-3 h-3 mr-1" />
                  Target: {targetPercent}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warnings/insights */}
      {timeData.bucketData.some(b => b.targetPercent !== null && Math.abs(b.difference) > 10) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Time allocation insights</h4>
              <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                {timeData.bucketData
                  .filter(b => b.targetPercent !== null && Math.abs(b.difference) > 10)
                  .map(b => (
                    <li key={b.bucket.id}>
                      <strong>{b.bucket.name}</strong>: {b.difference > 0 ? 'Over' : 'Under'} target by {Math.abs(b.difference)}%
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
