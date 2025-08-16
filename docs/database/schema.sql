-- FinQuest Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    grade INTEGER CHECK (grade >= 3 AND grade <= 7),
    school VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with learning preferences
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    learning_style VARCHAR(50) DEFAULT 'visual', -- visual, auditory, kinesthetic
    preferred_difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    session_length_preference INTEGER DEFAULT 15, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculum structure
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    grade_level INTEGER CHECK (grade_level >= 3 AND grade_level <= 7),
    difficulty_base DECIMAL(3,2) DEFAULT 0.5, -- Base difficulty 0.0-1.0
    learning_objectives TEXT[],
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question bank
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'drag_drop', 'scenario', 'fill_blank')),
    options JSONB, -- For multiple choice options
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    difficulty_level DECIMAL(3,2) DEFAULT 0.5, -- 0.0-1.0
    cognitive_level VARCHAR(50) DEFAULT 'remember', -- remember, understand, apply, analyze
    estimated_time INTEGER DEFAULT 30, -- seconds
    hints TEXT[],
    tags TEXT[],
    ai_generated BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress and mastery tracking
CREATE TABLE public.user_topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    mastery_score DECIMAL(5,4) DEFAULT 0.0, -- 0.0000-1.0000
    attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    last_attempted TIMESTAMP WITH TIME ZONE,
    mastery_level VARCHAR(20) DEFAULT 'novice', -- novice, developing, proficient, advanced
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- Quiz sessions and responses
CREATE TABLE public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'practice', -- practice, assessment, adaptive
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- seconds
    completion_rate DECIMAL(5,4) DEFAULT 0.0,
    difficulty_progression JSONB, -- Track difficulty changes
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false
);

CREATE TABLE public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER DEFAULT 0, -- seconds
    hints_used INTEGER DEFAULT 0,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    difficulty_at_attempt DECIMAL(3,2),
    response_pattern JSONB, -- For analytics (click patterns, etc.)
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification system
CREATE TABLE public.user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- seconds
    badges_earned INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    category VARCHAR(100), -- achievement, streak, mastery, social
    criteria JSONB NOT NULL, -- Conditions to earn badge
    xp_reward INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB, -- Current progress towards badge
    UNIQUE(user_id, badge_id)
);

-- Adaptive learning algorithm data
CREATE TABLE public.contextual_bandit_arms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    difficulty_level DECIMAL(3,2) NOT NULL,
    reward_sum DECIMAL(10,6) DEFAULT 0.0,
    play_count INTEGER DEFAULT 0,
    confidence_bound DECIMAL(10,6) DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic_id, difficulty_level)
);

CREATE TABLE public.learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- question_start, question_end, hint_used, etc.
    event_data JSONB,
    context JSONB, -- Device, time of day, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- global, grade, weekly, monthly
    criteria VARCHAR(100) NOT NULL, -- total_xp, streak, mastery_count
    time_period VARCHAR(50), -- week, month, all_time
    grade_filter INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID REFERENCES public.leaderboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    score DECIMAL(15,4) NOT NULL,
    rank_position INTEGER NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leaderboard_id, user_id, calculation_date::date)
);

-- Teachers and classroom management
CREATE TABLE public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    grade_level INTEGER CHECK (grade_level >= 3 AND grade_level <= 7),
    subject_focus UUID REFERENCES public.subjects(id),
    class_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(classroom_id, student_id)
);

-- Indexes for performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_grade ON public.users(grade);
CREATE INDEX idx_questions_topic_difficulty ON public.questions(topic_id, difficulty_level);
CREATE INDEX idx_user_topic_mastery_user ON public.user_topic_mastery(user_id);
CREATE INDEX idx_user_topic_mastery_topic ON public.user_topic_mastery(topic_id);
CREATE INDEX idx_quiz_sessions_user_topic ON public.quiz_sessions(user_id, topic_id);
CREATE INDEX idx_question_responses_session ON public.question_responses(session_id);
CREATE INDEX idx_user_stats_xp ON public.user_stats(total_xp DESC);
CREATE INDEX idx_leaderboard_entries_score ON public.leaderboard_entries(leaderboard_id, score DESC);
CREATE INDEX idx_learning_analytics_user_time ON public.learning_analytics(user_id, timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextual_bandit_arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Students can only see their own progress
CREATE POLICY "Students own progress" ON public.user_topic_mastery FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students own sessions" ON public.quiz_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students own responses" ON public.question_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students own stats" ON public.user_stats FOR ALL USING (auth.uid() = user_id);

-- Teachers can see their classroom students' data
CREATE POLICY "Teachers see classroom data" ON public.user_topic_mastery FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.classroom_students cs
        JOIN public.classrooms c ON cs.classroom_id = c.id
        WHERE cs.student_id = user_topic_mastery.user_id
        AND c.teacher_id = auth.uid()
    )
);

-- Public read access for curriculum content
CREATE POLICY "Public curriculum read" ON public.subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Public topics read" ON public.topics FOR SELECT USING (is_active = true);
CREATE POLICY "Public questions read" ON public.questions FOR SELECT USING (is_active = true);
CREATE POLICY "Public badges read" ON public.badges FOR SELECT USING (is_active = true);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_topic_mastery_updated_at BEFORE UPDATE ON public.user_topic_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
