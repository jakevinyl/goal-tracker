import type { CheckInResponse, TimeEntry, TimeTarget } from '@/lib/types/database';

// Calculate average score from check-in responses
export function calculateAverage(responses: CheckInResponse[]): number {
  if (responses.length === 0) return 0;
  const sum = responses.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / responses.length) * 10) / 10;
}

// Calculate total hours from time entries
export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((acc, e) => acc + e.hours, 0);
}

// Calculate hours by bucket
export function calculateHoursByBucket(entries: TimeEntry[]): Record<string, number> {
  return entries.reduce((acc, entry) => {
    acc[entry.bucket_id] = (acc[entry.bucket_id] || 0) + entry.hours;
    return acc;
  }, {} as Record<string, number>);
}

// Calculate allocation percentages
export function calculateAllocationPercent(
  entries: TimeEntry[],
  awakeHoursPerDay: number = 16,
  days: number = 7
): Record<string, number> {
  const totalAvailableHours = awakeHoursPerDay * days;
  const hoursByBucket = calculateHoursByBucket(entries);

  const percentages: Record<string, number> = {};
  for (const [bucketId, hours] of Object.entries(hoursByBucket)) {
    percentages[bucketId] = Math.round((hours / totalAvailableHours) * 1000) / 10;
  }

  return percentages;
}

// Calculate target hours from percentage
export function targetPercentToHours(
  targetPercent: number,
  awakeHoursPerDay: number = 16,
  days: number = 7
): number {
  const totalHours = awakeHoursPerDay * days;
  return Math.round((targetPercent / 100) * totalHours * 10) / 10;
}

// Calculate pacing status
export type PacingStatus = 'on_track' | 'slightly_behind' | 'behind' | 'ahead';

export function calculatePacingStatus(
  actual: number,
  target: number,
  tolerance: number = 0.1
): PacingStatus {
  if (actual === 0 && target === 0) return 'on_track';

  const ratio = actual / target;

  if (ratio >= 1) return 'ahead';
  if (ratio >= 1 - tolerance) return 'on_track';
  if (ratio >= 1 - tolerance * 2) return 'slightly_behind';
  return 'behind';
}

// Get color for pacing status
export function getPacingColor(status: PacingStatus): string {
  switch (status) {
    case 'ahead':
    case 'on_track':
      return 'text-green-600';
    case 'slightly_behind':
      return 'text-yellow-600';
    case 'behind':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// Calculate weekly capacity
export function calculateWeeklyCapacity(
  targets: TimeTarget[],
  awakeHoursPerDay: number = 16
): { allocated: number; unallocated: number; totalPercent: number } {
  const totalPercent = targets.reduce((acc, t) => acc + t.target_percent, 0);
  const weeklyHours = awakeHoursPerDay * 7;
  const allocatedHours = (totalPercent / 100) * weeklyHours;

  return {
    allocated: Math.round(allocatedHours * 10) / 10,
    unallocated: Math.round((weeklyHours - allocatedHours) * 10) / 10,
    totalPercent: Math.round(totalPercent * 10) / 10,
  };
}
