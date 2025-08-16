-- FinQuest Seed Data
-- Run this after schema.sql

-- Insert subjects
INSERT INTO public.subjects (id, name, description, color_hex, icon, sort_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Saving & Budgeting', 'Learn how to save money and create budgets', '#22c55e', 'piggy-bank', 1),
    ('550e8400-e29b-41d4-a716-446655440002', 'Spending Wisely', 'Make smart spending decisions', '#3b82f6', 'shopping-cart', 2),
    ('550e8400-e29b-41d4-a716-446655440003', 'Banking Basics', 'Understanding banks and accounts', '#8b5cf6', 'building-2', 3),
    ('550e8400-e29b-41d4-a716-446655440004', 'Investment & Growth', 'Making money grow over time', '#f59e0b', 'trending-up', 4),
    ('550e8400-e29b-41d4-a716-446655440005', 'Entrepreneurship', 'Starting your own business', '#ef4444', 'lightbulb', 5);

-- Insert topics for Grade 3-4
INSERT INTO public.topics (id, subject_id, name, description, grade_level, difficulty_base, learning_objectives, sort_order) VALUES
    -- Saving & Budgeting for Grade 3
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'What is Money?', 'Understanding what money is and why we use it', 3, 0.3, ARRAY['Identify different types of money', 'Understand the purpose of money'], 1),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Saving Money', 'Why and how to save money', 3, 0.4, ARRAY['Explain why saving is important', 'Identify ways to save money'], 2),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Needs vs Wants', 'Difference between things we need and want', 3, 0.4, ARRAY['Distinguish between needs and wants', 'Make spending decisions'], 1),
    
    -- Grade 4 topics
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Making a Budget', 'Creating simple budgets for allowance', 4, 0.5, ARRAY['Create a basic budget', 'Track income and expenses'], 3),
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Smart Shopping', 'How to be a wise shopper', 4, 0.5, ARRAY['Compare prices', 'Make smart purchasing decisions'], 2),
    
    -- Grade 5-6 topics
    ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Bank Accounts', 'How banks work and types of accounts', 5, 0.6, ARRAY['Understand how banks work', 'Compare account types'], 1),
    ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'Interest & Growth', 'How money can grow over time', 5, 0.6, ARRAY['Understand compound interest', 'Calculate simple interest'], 1),
    
    -- Grade 7 topics
    ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Investment Basics', 'Introduction to stocks and bonds', 7, 0.7, ARRAY['Understand investment types', 'Analyze risk vs reward'], 2),
    ('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'Starting a Business', 'Basics of entrepreneurship', 7, 0.8, ARRAY['Develop business ideas', 'Understand profit and loss'], 1);

-- Insert sample questions
INSERT INTO public.questions (id, topic_id, question_text, question_type, options, correct_answer, explanation, difficulty_level, cognitive_level) VALUES
    -- Grade 3 - What is Money?
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 
     'Which of these is money?', 
     'multiple_choice',
     '{"A": "Coins", "B": "Rocks", "C": "Leaves", "D": "Toys"}',
     '{"answer": "A", "explanation": "Coins are a form of money we use to buy things"}',
     'Money includes coins and bills that we use to purchase goods and services.',
     0.2, 'remember'),
     
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001',
     'Why do we use money?',
     'multiple_choice', 
     '{"A": "To play games", "B": "To buy things we need", "C": "To collect pretty things", "D": "To make noise"}',
     '{"answer": "B", "explanation": "We use money to buy things we need and want"}',
     'Money is a tool that helps us trade for goods and services.',
     0.3, 'understand'),
     
    -- Grade 3 - Needs vs Wants
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003',
     'Which item is a NEED?',
     'multiple_choice',
     '{"A": "Video game", "B": "Candy", "C": "Food", "D": "Toy"}',
     '{"answer": "C", "explanation": "Food is something our body needs to stay healthy and alive"}',
     'Needs are things essential for survival like food, water, shelter, and clothing.',
     0.4, 'understand'),
     
    -- Grade 4 - Making a Budget  
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004',
     'If you get $10 allowance and want to save $3, how much can you spend?',
     'multiple_choice',
     '{"A": "$13", "B": "$7", "C": "$10", "D": "$3"}',
     '{"answer": "B", "explanation": "If you save $3 from $10, you have $7 left to spend"}',
     'When budgeting, subtract savings from income to find spending money.',
     0.5, 'apply'),
     
    -- Grade 5 - Bank Accounts
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006',
     'What is interest on a savings account?',
     'multiple_choice',
     '{"A": "Money the bank takes away", "B": "Money the bank pays you for keeping money there", "C": "A fee for using the bank", "D": "Money you owe the bank"}',
     '{"answer": "B", "explanation": "Interest is money the bank pays you for keeping your money in their account"}',
     'Banks pay interest as a reward for saving money with them.',
     0.6, 'understand'),
     
    -- Grade 7 - Investment Basics
    ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440008',
     'What is a stock?',
     'multiple_choice',
     '{"A": "A type of savings account", "B": "A small piece of ownership in a company", "C": "Money borrowed from a bank", "D": "A type of piggy bank"}',
     '{"answer": "B", "explanation": "A stock represents partial ownership in a company"}',
     'When you buy stock, you become a partial owner of that company.',
     0.7, 'understand');

-- Insert badges
INSERT INTO public.badges (id, name, description, icon, category, criteria, xp_reward, rarity) VALUES
    ('880e8400-e29b-41d4-a716-446655440001', 'First Steps', 'Complete your first quiz', '🎯', 'achievement', '{"type": "quiz_completed", "count": 1}', 50, 'common'),
    ('880e8400-e29b-41d4-a716-446655440002', 'Streak Starter', 'Answer 5 questions correctly in a row', '🔥', 'streak', '{"type": "correct_streak", "count": 5}', 100, 'common'),
    ('880e8400-e29b-41d4-a716-446655440003', 'Money Master', 'Complete all topics in Saving & Budgeting', '💰', 'mastery', '{"type": "subject_mastery", "subject_id": "550e8400-e29b-41d4-a716-446655440001"}', 500, 'rare'),
    ('880e8400-e29b-41d4-a716-446655440004', 'Speed Demon', 'Answer 10 questions in under 5 minutes', '⚡', 'achievement', '{"type": "speed_challenge", "questions": 10, "time_limit": 300}', 200, 'rare'),
    ('880e8400-e29b-41d4-a716-446655440005', 'Perfect Week', 'Login and practice every day for a week', '📅', 'streak', '{"type": "daily_login", "days": 7}', 300, 'epic'),
    ('880e8400-e29b-41d4-a716-446655440006', 'Quiz Champion', 'Score 100% on 5 different quizzes', '🏆', 'achievement', '{"type": "perfect_scores", "count": 5}', 400, 'epic'),
    ('880e8400-e29b-41d4-a716-446655440007', 'Investment Genius', 'Master all investment topics', '📈', 'mastery', '{"type": "subject_mastery", "subject_id": "550e8400-e29b-41d4-a716-446655440004"}', 750, 'legendary');

-- Insert leaderboards
INSERT INTO public.leaderboards (id, name, type, criteria, time_period, is_active) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'Global XP Leaders', 'global', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440002', 'Weekly Champions', 'global', 'weekly_xp', 'week', true),
    ('990e8400-e29b-41d4-a716-446655440003', 'Grade 3 Leaders', 'grade', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440004', 'Grade 4 Leaders', 'grade', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440005', 'Grade 5 Leaders', 'grade', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440006', 'Grade 6 Leaders', 'grade', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440007', 'Grade 7 Leaders', 'grade', 'total_xp', 'all_time', true),
    ('990e8400-e29b-41d4-a716-446655440008', 'Streak Masters', 'global', 'longest_streak', 'all_time', true);

-- Update leaderboard entries to include grade filters
UPDATE public.leaderboards SET grade_filter = 3 WHERE name = 'Grade 3 Leaders';
UPDATE public.leaderboards SET grade_filter = 4 WHERE name = 'Grade 4 Leaders';
UPDATE public.leaderboards SET grade_filter = 5 WHERE name = 'Grade 5 Leaders';
UPDATE public.leaderboards SET grade_filter = 6 WHERE name = 'Grade 6 Leaders';
UPDATE public.leaderboards SET grade_filter = 7 WHERE name = 'Grade 7 Leaders';
