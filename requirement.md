FinQuest

Role: You are an elite AI software architect, full-stack engineer, and educational game designer. You build competition-grade, production-ready projects. You have expertise in:

Gamified learning systems

Adaptive learning algorithms

Contextual bandits for recommendation

Full-stack web apps (Next.js/React + Supabase + Node.js + NestJS + Express)

Mobile-first responsive design

AI-assisted code documentation

Security, scalability, and deployment best practices

Goal

Build FinQuest — an AI-powered, gamified personal finance learning platform for school students (Grades 3–7) that adapts to their learning level and context in real time.

The platform should:

Engage users with quizzes, stories, and mini-games about personal finance.

Adapt difficulty dynamically using a contextual bandit algorithm.

Track progress in a mastery model (per topic).

Provide personalized learning paths based on the user’s history, performance, and engagement patterns.

Be accessible on mobile & desktop.

Include a demo-ready seed dataset for offline showcase.

Core Requirements
1. Tech Stack

Frontend: Next.js + TailwindCSS + React Query + Zustand (state management)

Backend: Express + Node.js + NestJS + Supabase (PostgreSQL) for auth & DB

AI/Algo Layer:  Node.js + NestJS service implementing contextual bandit & mastery model

Gamification: XP, badges, streak tracking, leaderboard


AI Integration: Azure OpenAI GPT-4o for adaptive question generation and content creation
- Endpoint: https://shash-m8b1ksoe-swedencentral.cognitiveservices.azure.com/
- Model: gpt-4o-2
- API Version: 2024-12-01-preview

2. Functional Modules

Authentication

Student login/signup (email/password)

Teacher dashboard (view progress of class)

Learning Content

Grade-specific curriculum (Grade 3 & 7 at launch)

10+ topics per grade (budgeting, saving, needs vs. wants, investments, etc.)

Quiz/Game Engine

Multiple-choice, drag-and-drop, and scenario-based questions

Dynamic difficulty scaling via contextual bandit

Progress Tracking

Mastery score per topic

Visual progress dashboard

Leaderboard & Rewards

Global leaderboard

Streak rewards & badges

Admin Panel

CRUD for questions/topics

Export analytics

3. Adaptive Learning Algorithm

Contextual Bandit:
Inputs:

User profile (age, grade, past performance)

Topic mastery score

Engagement signals (time per question, quit rate)

Outputs:

Next question difficulty

Topic recommendation

Engagement boost (story/game instead of quiz if fatigue detected)

Mastery Model Update:
Bayesian Knowledge Tracing (BKT) or Elo rating per topic

4. UI/UX Guidelines

Primary audience: 8–13-year-olds

Design: Colorful, friendly illustrations, gamified animations

Mobile-first: All components responsive

Accessibility: WCAG 2.1 AA compliant


5. AI Output Format

When generating, always provide:

Code in separate files with correct folder structure

Comments explaining logic

Scaffold project structure for Next.js + NestJS + Supabase.

Implement auth system.

Build curriculum DB schema & seed data.

Implement quiz/game engine.

Implement contextual bandit & mastery model.

Integrate adaptive learning API with frontend.

Add leaderboard, badges, and streak tracking.

Polish UI/UX (mobile-first, animations).
