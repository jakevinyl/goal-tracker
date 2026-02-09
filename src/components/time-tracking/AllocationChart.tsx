'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { TimeEntry, TimeTarget, Bucket } from '@/lib/types/database';
import { calculateHoursByBucket, targetPercentToHours, calculatePacingStatus, getPacingColor } from '@/lib/utils/calculations';

interface AllocationChartProps {
  entries: TimeEntry[];
  targets: (TimeTarget & { buckets: Bucket })[];
  buckets: Bucket[];
  awakeHoursPerDay: number;
}

export function AllocationChart({ entries, targets, buckets, awakeHoursPerDay }: AllocationChartProps) {
  const hoursByBucket = calculateHoursByBucket(entries);
  const totalAvailableHours = awakeHoursPerDay * 7;
  const totalLoggedHours = Object.values(hoursByBucket).reduce((sum, h) => sum + h, 0);

  // Create a map of target percentages
  const targetMap = new Map(targets.map((t) => [t.bucket_id, t.target_percent]));

  // Sort buckets by target hours (descending)
  const sortedBuckets = buckets
    .map((bucket) => {
      const targetPercent = targetMap.get(bucket.id) || 0;
      const targetHours = targetPercentToHours(targetPercent, awakeHoursPerDay, 7);
      const actualHours = hoursByBucket[bucket.id] || 0;
      const status = calculatePacingStatus(actualHours, targetHours, 0.15);

      return {
        ...bucket,
        targetPercent,
        targetHours,
        actualHours,
        status,
      };
    })
    .filter((b) => b.targetPercent > 0 || b.actualHours > 0)
    .sort((a, b) => b.targetHours - a.targetHours);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Allocation</CardTitle>
          <div className="text-sm text-gray-500">
            {totalLoggedHours.toFixed(1)}h / {totalAvailableHours}h
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedBuckets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No time targets configured. Set targets in settings to see allocation.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedBuckets.map((bucket) => {
              const actualPercent = (bucket.actualHours / totalAvailableHours) * 100;
              const maxWidth = Math.max(bucket.targetPercent, actualPercent, 1);

              return (
                <div key={bucket.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {bucket.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getPacingColor(bucket.status)}>
                        {bucket.actualHours.toFixed(1)}h
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-500">
                        {bucket.targetHours.toFixed(1)}h
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    {/* Target line */}
                    {bucket.targetPercent > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                        style={{
                          left: `${(bucket.targetPercent / maxWidth) * 100}%`,
                        }}
                      />
                    )}

                    {/* Actual progress */}
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(actualPercent / maxWidth) * 100}%`,
                        backgroundColor: bucket.color,
                      }}
                    />
                  </div>

                  {/* Status indicator */}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      {actualPercent.toFixed(1)}% of week
                    </span>
                    <span className={getPacingColor(bucket.status)}>
                      {bucket.status === 'ahead' && '✓ Ahead'}
                      {bucket.status === 'on_track' && '✓ On track'}
                      {bucket.status === 'slightly_behind' && '→ Slightly behind'}
                      {bucket.status === 'behind' && '⚠ Behind'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Unallocated time this week</span>
            <span className="font-medium text-gray-900">
              {(totalAvailableHours - totalLoggedHours).toFixed(1)}h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
