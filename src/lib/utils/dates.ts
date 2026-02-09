import { format, formatDistanceToNow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isToday, isYesterday, parseISO, differenceInDays } from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';

  return formatDistanceToNow(d, { addSuffix: true });
}

export function getWeekRange(date: Date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getLast7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(subDays(new Date(), i));
  }
  return days;
}

export function getLast30Days(): Date[] {
  const days: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(subDays(new Date(), i));
  }
  return days;
}

export function toLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Sort dates in descending order
  const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = toLocalDateString();
  const yesterday = toLocalDateString(subDays(new Date(), 1));

  // Check if streak includes today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  let currentDate = sortedDates[0];

  for (const date of sortedDates) {
    if (date === currentDate) {
      streak++;
      currentDate = toLocalDateString(subDays(parseISO(date), 1));
    } else if (differenceInDays(parseISO(currentDate), parseISO(date)) > 0) {
      break; // Gap found, streak ends
    }
  }

  return streak;
}
