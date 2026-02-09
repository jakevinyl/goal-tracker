'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, Clock, Plus, BookOpen } from 'lucide-react';

interface QuickActionsProps {
  hasCheckedInToday: boolean;
}

export function QuickActions({ hasCheckedInToday }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {!hasCheckedInToday && (
        <Link href="/dashboard/daily">
          <Button className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Check In</span>
          </Button>
        </Link>
      )}

      <Link href="/dashboard/time">
        <Button variant="outline" className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Log Time</span>
        </Button>
      </Link>

      <Link href="/dashboard/tasks">
        <Button variant="outline" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </Button>
      </Link>

      <Link href="/dashboard/progress">
        <Button variant="outline" className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4" />
          <span>Log Progress</span>
        </Button>
      </Link>
    </div>
  );
}
