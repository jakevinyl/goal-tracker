'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';
import type { TimeEntry, Bucket } from '@/lib/types/database';
import { calculateTotalHours, calculateHoursByBucket } from '@/lib/utils/calculations';

interface TimeOverviewProps {
  timeEntries: (TimeEntry & { buckets: Bucket })[];
  buckets: Bucket[];
}

export function TimeOverview({ timeEntries, buckets }: TimeOverviewProps) {
  const totalHours = calculateTotalHours(timeEntries);
  const hoursByBucket = calculateHoursByBucket(timeEntries);

  // Get today's entries
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = timeEntries.filter((e) => e.entry_date === today);
  const todayHours = calculateTotalHours(todayEntries);

  // Sort buckets by hours logged
  const sortedBuckets = buckets
    .map((b) => ({
      ...b,
      hours: hoursByBucket[b.id] || 0,
    }))
    .filter((b) => b.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time This Week</CardTitle>
          <div className="flex items-center space-x-1 text-blue-600">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{totalHours.toFixed(1)}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Today's summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{todayHours.toFixed(1)}h</p>
            <p className="text-sm text-gray-500">logged today</p>
          </div>

          {/* Bucket breakdown */}
          {sortedBuckets.length > 0 ? (
            <div className="space-y-2">
              {sortedBuckets.map((bucket) => (
                <div key={bucket.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="text-sm text-gray-700 truncate max-w-[150px]">
                      {bucket.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {bucket.hours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No time logged this week
            </p>
          )}

          <Link href="/dashboard/time">
            <Button variant="outline" className="w-full">
              Log Time
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
