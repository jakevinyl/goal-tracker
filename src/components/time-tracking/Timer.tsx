'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Bucket } from '@/lib/types/database';
import { Play, Pause, Square, Clock } from 'lucide-react';

interface TimerProps {
  buckets: Bucket[];
  userId: string;
}

export function Timer({ buckets, userId }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedBucket) {
      alert('Please select a bucket first');
      return;
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = async () => {
    if (elapsedSeconds < 60) {
      // Don't save entries less than 1 minute
      setIsRunning(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      return;
    }

    setIsSaving(true);

    const hours = Math.round((elapsedSeconds / 3600) * 100) / 100; // Round to 2 decimals
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        bucket_id: selectedBucket,
        entry_date: today,
        hours,
        description: description || null,
        entry_type: 'timer',
      });

    if (error) {
      console.error('Error saving time entry:', error);
      alert('Failed to save time entry');
    } else {
      // Reset timer
      setIsRunning(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setDescription('');
      router.refresh();
    }

    setIsSaving(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Timer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bucket Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bucket
          </label>
          <select
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          >
            <option value="">Select a bucket...</option>
            {buckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.name}
              </option>
            ))}
          </select>
        </div>

        {/* Timer Display */}
        <div className="text-center py-6">
          <div className="text-5xl font-mono font-bold text-gray-900">
            {formatTime(elapsedSeconds)}
          </div>
          {isRunning && selectedBucket && (
            <p className="text-sm text-gray-500 mt-2">
              {buckets.find((b) => b.id === selectedBucket)?.name}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg" className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Start</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePause}
                variant="outline"
                size="lg"
                className="flex items-center space-x-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleStop}
                variant="primary"
                size="lg"
                isLoading={isSaving}
                className="flex items-center space-x-2"
              >
                <Square className="w-5 h-5" />
                <span>Stop & Save</span>
              </Button>
            </>
          )}
        </div>

        {/* Description (when running) */}
        {isRunning && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Reset button */}
        {isRunning && elapsedSeconds > 0 && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset without saving
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
