-- Goal Tracking App - Initial Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BUCKETS (Life Areas)
-- ============================================
CREATE TABLE buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_bucket_id UUID REFERENCES buckets(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name, parent_bucket_id)
);

CREATE INDEX idx_buckets_user_id ON buckets(user_id);
CREATE INDEX idx_buckets_parent_id ON buckets(parent_bucket_id);

-- ============================================
-- GOALS
-- ============================================
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'archived')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    target_date DATE,
    completed_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    recurrence TEXT CHECK (recurrence IN ('quarterly_review', 'annual', 'none', NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_bucket_id ON goals(bucket_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_target_date ON goals(target_date);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'complete', 'snoozed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- e.g., 'weekly', 'monthly', 'quarterly'
    snoozed_until DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_bucket_id ON tasks(bucket_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================
-- SURVEY QUESTIONS (Daily Check-In)
-- ============================================
CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    baseline_score NUMERIC(3,1) DEFAULT 5.0,
    target_score NUMERIC(3,1),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_user_id ON survey_questions(user_id);

-- ============================================
-- CHECK-IN RESPONSES
-- ============================================
CREATE TABLE check_in_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    score NUMERIC(3,1) NOT NULL CHECK (score >= 1 AND score <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id, check_in_date)
);

CREATE INDEX idx_check_in_responses_user_id ON check_in_responses(user_id);
CREATE INDEX idx_check_in_responses_date ON check_in_responses(check_in_date);
CREATE INDEX idx_check_in_responses_question ON check_in_responses(question_id);

-- ============================================
-- TIME TARGETS (Allocation per bucket)
-- ============================================
CREATE TABLE time_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    target_percent NUMERIC(5,2) NOT NULL CHECK (target_percent >= 0 AND target_percent <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bucket_id)
);

CREATE INDEX idx_time_targets_user_id ON time_targets(user_id);
CREATE INDEX idx_time_targets_bucket_id ON time_targets(bucket_id);

-- ============================================
-- TIME ENTRIES
-- ============================================
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    entry_date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL CHECK (hours > 0),
    description TEXT,
    entry_type TEXT DEFAULT 'manual' CHECK (entry_type IN ('manual', 'timer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_bucket_id ON time_entries(bucket_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);

-- ============================================
-- PROGRESS LOG ENTRIES (Journal)
-- ============================================
CREATE TABLE progress_log_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id UUID REFERENCES buckets(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_log_user_id ON progress_log_entries(user_id);
CREATE INDEX idx_progress_log_bucket_id ON progress_log_entries(bucket_id);
CREATE INDEX idx_progress_log_date ON progress_log_entries(entry_date);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    awake_hours_per_day NUMERIC(4,2) DEFAULT 16.0,
    check_in_reminder_time TIME DEFAULT '21:00',
    timezone TEXT DEFAULT 'America/New_York',
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Buckets policies
CREATE POLICY "Users can view their own buckets" ON buckets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own buckets" ON buckets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own buckets" ON buckets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own buckets" ON buckets FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Survey questions policies
CREATE POLICY "Users can view their own survey questions" ON survey_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own survey questions" ON survey_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own survey questions" ON survey_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own survey questions" ON survey_questions FOR DELETE USING (auth.uid() = user_id);

-- Check-in responses policies
CREATE POLICY "Users can view their own check-ins" ON check_in_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own check-ins" ON check_in_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins" ON check_in_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own check-ins" ON check_in_responses FOR DELETE USING (auth.uid() = user_id);

-- Time targets policies
CREATE POLICY "Users can view their own time targets" ON time_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own time targets" ON time_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time targets" ON time_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time targets" ON time_targets FOR DELETE USING (auth.uid() = user_id);

-- Time entries policies
CREATE POLICY "Users can view their own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time entries" ON time_entries FOR DELETE USING (auth.uid() = user_id);

-- Progress log policies
CREATE POLICY "Users can view their own progress logs" ON progress_log_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress logs" ON progress_log_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress logs" ON progress_log_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress logs" ON progress_log_entries FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_buckets_updated_at BEFORE UPDATE ON buckets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_questions_updated_at BEFORE UPDATE ON survey_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_targets_updated_at BEFORE UPDATE ON time_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_log_updated_at BEFORE UPDATE ON progress_log_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REAL-TIME (Optional)
-- ============================================
-- Uncomment these if you want real-time subscriptions
-- ALTER PUBLICATION supabase_realtime ADD TABLE buckets;
-- ALTER PUBLICATION supabase_realtime ADD TABLE goals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE check_in_responses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
-- ALTER PUBLICATION supabase_realtime ADD TABLE progress_log_entries;
