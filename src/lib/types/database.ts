// Database types matching Supabase schema

export type Bucket = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_bucket_id: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  bucket_id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'complete' | 'archived';
  progress_percent: number;
  target_date: string | null;
  completed_date: string | null;
  priority: 'low' | 'medium' | 'high';
  recurrence: 'quarterly_review' | 'annual' | 'none' | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  bucket_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: 'open' | 'complete' | 'snoozed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  expected_hours: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_delegated: boolean;
  delegated_to: string | null;
  snoozed_until: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SurveyQuestion = {
  id: string;
  user_id: string;
  question_text: string;
  baseline_score: number;
  target_score: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CheckInResponse = {
  id: string;
  user_id: string;
  question_id: string;
  check_in_date: string;
  score: number;
  notes: string | null;
  created_at: string;
};

export type TimeTarget = {
  id: string;
  user_id: string;
  bucket_id: string;
  target_percent: number;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  user_id: string;
  bucket_id: string;
  task_id: string | null;
  entry_date: string;
  hours: number;
  description: string | null;
  entry_type: 'manual' | 'timer';
  created_at: string;
  updated_at: string;
};

export type ProgressLogEntry = {
  id: string;
  user_id: string;
  bucket_id: string | null;
  goal_id: string | null;
  entry_date: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  awake_hours_per_day: number;
  check_in_reminder_time: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  created_at: string;
  updated_at: string;
};

// Extended types with relations
export type BucketWithRelations = Bucket & {
  children?: Bucket[];
  parent?: Bucket;
  time_target?: TimeTarget;
};

export type GoalWithBucket = Goal & {
  bucket: Bucket;
};

export type TaskWithRelations = Task & {
  bucket: Bucket;
  goal?: Goal;
};

export type CheckInWithQuestion = CheckInResponse & {
  question: SurveyQuestion;
};

export type TimeEntryWithBucket = TimeEntry & {
  bucket: Bucket;
};

// Insert/Update types (without server-generated fields)
export type BucketInsert = Omit<Bucket, 'id' | 'created_at' | 'updated_at'>;
export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type CheckInInsert = Omit<CheckInResponse, 'id' | 'created_at'>;
export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>;
export type ProgressLogInsert = Omit<ProgressLogEntry, 'id' | 'created_at' | 'updated_at'>;
