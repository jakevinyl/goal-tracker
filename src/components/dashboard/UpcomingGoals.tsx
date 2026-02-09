'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Target, Calendar, ArrowRight } from 'lucide-react';
import type { Goal, Bucket } from '@/lib/types/database';
import { formatDate, formatRelative } from '@/lib/utils/dates';

interface UpcomingGoalsProps {
  goals: (Goal & { buckets: Bucket })[];
}

export function UpcomingGoals({ goals }: UpcomingGoalsProps) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Milestones</CardTitle>
          <Link href="/dashboard/goals">
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${goal.buckets?.color}20` }}
                >
                  <Target
                    className="w-5 h-5"
                    style={{ color: goal.buckets?.color }}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{goal.title}</p>
                  <p className="text-sm text-gray-500">{goal.buckets?.name}</p>
                </div>
              </div>
              {goal.target_date && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatRelative(goal.target_date)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
