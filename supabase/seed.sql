-- Goal Tracking App - Seed Data
-- Run this AFTER the initial schema, replacing 'YOUR_USER_ID' with your actual user ID
-- You can get your user ID from Supabase Auth after signing up

-- ============================================
-- INSTRUCTIONS:
-- 1. Sign up in the app first to create your user account
-- 2. Go to Supabase Dashboard > Authentication > Users
-- 3. Copy your User ID (UUID)
-- 4. Replace 'YOUR_USER_ID' below with your actual UUID
-- 5. Run this script in Supabase SQL Editor
-- ============================================

-- Alternatively, use this function to seed data for the currently logged-in user
-- (Run this from a server-side script with user context)

-- For manual seeding, set your user ID here:
DO $$
DECLARE
    v_user_id UUID := 'YOUR_USER_ID'; -- Replace with your actual user ID
    v_personal_id UUID;
    v_kids_together_id UUID;
    v_hunter_solo_id UUID;
    v_piper_solo_id UUID;
    v_jackie_id UUID;
    v_friendships_id UUID;
    v_health_id UUID;
    v_financial_id UUID;
    v_purpose_id UUID;
    v_time_freedom_id UUID;
    v_learning_id UUID;
    v_publishing_id UUID;
    v_portfolio_id UUID;
    v_relationships_parent_id UUID;
    v_alive_question_id UUID;
BEGIN
    -- Skip if placeholder user ID
    IF v_user_id = 'YOUR_USER_ID' THEN
        RAISE NOTICE 'Please replace YOUR_USER_ID with your actual user ID';
        RETURN;
    END IF;

    -- ============================================
    -- CREATE BUCKETS
    -- ============================================

    -- Top-level buckets
    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Personal & Spiritual', 'Personal growth, learning, and spiritual development', '#8B5CF6', 'heart', 1)
    RETURNING id INTO v_personal_id;

    -- Relationships parent bucket (for grouping)
    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Relationships', 'Family, friendships, and connections', '#EC4899', 'users', 2)
    RETURNING id INTO v_relationships_parent_id;

    -- Relationships sub-buckets
    INSERT INTO buckets (id, user_id, name, description, parent_bucket_id, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Kids (Together)', 'Time with both kids together', v_relationships_parent_id, '#F472B6', 'users', 1)
    RETURNING id INTO v_kids_together_id;

    INSERT INTO buckets (id, user_id, name, description, parent_bucket_id, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Hunter Solo', 'One-on-one time with Hunter', v_relationships_parent_id, '#F472B6', 'user', 2)
    RETURNING id INTO v_hunter_solo_id;

    INSERT INTO buckets (id, user_id, name, description, parent_bucket_id, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Piper Solo', 'One-on-one time with Piper', v_relationships_parent_id, '#F472B6', 'user', 3)
    RETURNING id INTO v_piper_solo_id;

    INSERT INTO buckets (id, user_id, name, description, parent_bucket_id, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Jackie', 'Relationship with Jackie', v_relationships_parent_id, '#EC4899', 'heart', 4)
    RETURNING id INTO v_jackie_id;

    INSERT INTO buckets (id, user_id, name, description, parent_bucket_id, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Friendships', 'Friends and social connections', v_relationships_parent_id, '#F472B6', 'users', 5)
    RETURNING id INTO v_friendships_id;

    -- Other top-level buckets
    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Health', 'Physical health, fitness, and wellness', '#10B981', 'activity', 3)
    RETURNING id INTO v_health_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Financial Freedom', 'Financial planning and wealth building', '#F59E0B', 'dollar-sign', 4)
    RETURNING id INTO v_financial_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Purpose & Mission', 'Life purpose, thesis, and publishing', '#3B82F6', 'compass', 5)
    RETURNING id INTO v_purpose_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Time Freedom', 'Time management and lifestyle design', '#6366F1', 'clock', 6)
    RETURNING id INTO v_time_freedom_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Learning', 'Education and skill development', '#14B8A6', 'book-open', 7)
    RETURNING id INTO v_learning_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Publishing', 'Content creation and publishing', '#8B5CF6', 'edit-3', 8)
    RETURNING id INTO v_publishing_id;

    INSERT INTO buckets (id, user_id, name, description, color, icon, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'Portfolio Companies', 'Investments and portfolio management', '#F59E0B', 'briefcase', 9)
    RETURNING id INTO v_portfolio_id;

    -- ============================================
    -- CREATE SURVEY QUESTION
    -- ============================================
    INSERT INTO survey_questions (id, user_id, question_text, baseline_score, target_score, sort_order)
    VALUES (uuid_generate_v4(), v_user_id, 'How alive do I feel today?', 4.5, 7.0, 1)
    RETURNING id INTO v_alive_question_id;

    -- ============================================
    -- CREATE TIME TARGETS
    -- ============================================
    INSERT INTO time_targets (user_id, bucket_id, target_percent) VALUES
    (v_user_id, v_kids_together_id, 10.0),
    (v_user_id, v_hunter_solo_id, 2.5),
    (v_user_id, v_piper_solo_id, 2.5);

    -- ============================================
    -- CREATE USER SETTINGS
    -- ============================================
    INSERT INTO user_settings (user_id, awake_hours_per_day, check_in_reminder_time, timezone)
    VALUES (v_user_id, 16.0, '21:00', 'America/New_York');

    -- ============================================
    -- CREATE GOALS
    -- ============================================
    INSERT INTO goals (user_id, bucket_id, title, description, target_date, status) VALUES
    (v_user_id, v_health_id, 'Baseline DEXA scan', 'Get baseline body composition measurement', '2026-01-31', 'not_started'),
    (v_user_id, v_financial_id, 'Portfolio strategy defined', 'Define investment strategy for portfolio companies', '2026-01-31', 'not_started'),
    (v_user_id, v_purpose_id, 'Thesis/brand defined', 'Define personal brand and thesis', '2026-02-14', 'not_started'),
    (v_user_id, v_purpose_id, 'Publishing infrastructure decided', 'Choose platform and setup for publishing', '2026-02-21', 'not_started'),
    (v_user_id, v_time_freedom_id, 'Time allocation by bucket defined', 'Set target percentages for all life areas', '2026-02-28', 'not_started'),
    (v_user_id, v_financial_id, 'Portfolio strategy implemented', 'Execute on defined portfolio strategy', '2026-02-28', 'not_started'),
    (v_user_id, v_purpose_id, 'First piece published', 'Publish first content piece', '2026-02-28', 'not_started'),
    (v_user_id, v_time_freedom_id, 'Klaviyo conversation', 'Have conversation about time/flexibility', '2026-03-15', 'not_started'),
    (v_user_id, v_financial_id, 'Financial tracking view built', 'Build dashboard for financial tracking', '2026-03-31', 'not_started'),
    (v_user_id, v_purpose_id, 'Thesis revisit (June)', 'Review and refine thesis', '2026-06-01', 'not_started'),
    (v_user_id, v_purpose_id, 'Thesis revisit (October)', 'Review and refine thesis', '2026-10-01', 'not_started');

    -- Quarterly recurring goals
    INSERT INTO goals (user_id, bucket_id, title, description, recurrence, status) VALUES
    (v_user_id, v_health_id, 'DEXA scan', 'Quarterly body composition check', 'quarterly_review', 'not_started'),
    (v_user_id, v_health_id, 'Quarterly fitness challenge', 'Take on a fitness challenge each quarter', 'quarterly_review', 'not_started'),
    (v_user_id, v_personal_id, '1 big experience', 'Have one big meaningful experience per quarter', 'quarterly_review', 'not_started'),
    (v_user_id, v_kids_together_id, 'Check in on Hunter long-term project', 'Review Hunter''s long-term goals/projects', 'quarterly_review', 'not_started');

    -- ============================================
    -- CREATE RECURRING TASKS
    -- ============================================
    INSERT INTO tasks (user_id, bucket_id, title, description, is_recurring, recurrence_rule, priority) VALUES
    (v_user_id, v_jackie_id, 'Take 1 thing off Jackie''s plate', 'Find something to help with this week', true, 'weekly', 'high'),
    (v_user_id, v_jackie_id, 'Promote 1 of Jackie''s therapeutic activities', 'Encourage or facilitate one of her activities', true, 'weekly', 'medium'),
    (v_user_id, v_personal_id, '1 contributory block (~4 hrs)', 'Dedicate time to meaningful contribution', true, 'weekly', 'high'),
    (v_user_id, v_jackie_id, 'Couples therapy', 'Monthly couples therapy session', true, 'monthly', 'high'),
    (v_user_id, v_friendships_id, '1 social event with a new person', 'Meet someone new or expand social circle', true, 'monthly', 'medium'),
    (v_user_id, v_personal_id, '1 meaningful experience', 'Have one meaningful experience this month', true, 'monthly', 'medium');

    RAISE NOTICE 'Seed data created successfully!';
END $$;
